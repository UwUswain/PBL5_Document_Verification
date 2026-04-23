import os
import re
import json
import uuid
import unicodedata
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv
load_dotenv()

# Cấu hình Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def _init_model(name: str):
    try:
        return genai.GenerativeModel(name)
    except Exception as e:
        print(f"❌ Gemini model init error for '{name}': {e}")
        return None


# Model name có thể thay đổi theo thời gian; ưu tiên đọc từ env để dễ deploy
_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip() or "gemini-flash-latest"
_FALLBACK_MODEL_NAME = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-flash-latest").strip() or "gemini-flash-latest"

model = _init_model(_MODEL_NAME) or _init_model("gemini-flash-latest")
fallback_model = None if _FALLBACK_MODEL_NAME == _MODEL_NAME else _init_model(_FALLBACK_MODEL_NAME)

def _extract_json_object(text: str) -> dict | None:
    if not text:
        return None
    text = text.strip()

    # Strip common code fences if model wraps JSON (```json ... ```)
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text).strip()
    # Ưu tiên parse thẳng nếu model trả đúng JSON
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # Fallback: trích xuất object JSON đầu tiên
    json_match = re.search(r'\{[\s\S]*\}', text, re.DOTALL)
    if not json_match:
        # "Móc lốp": tìm { đầu tiên và } cuối cùng (trong trường hợp regex fail)
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
            return None
        json_str = text[start_idx : end_idx + 1]
        try:
            parsed = json.loads(json_str)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None
    try:
        parsed = json.loads(json_match.group())
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None
    return None


def _response_to_text(response) -> str:
    """
    google-generativeai SDK đôi khi không populate `response.text` (hoặc trả theo parts).
    Hàm này cố gắng lấy text theo nhiều đường để tăng tỉ lệ parse JSON thành công.
    """
    if response is None:
        return ""

    # `response.text` có thể raise nếu response không có valid Part (ví dụ bị safety block)
    try:
        text = response.text
        if isinstance(text, str) and text.strip():
            return text.strip()
    except Exception:
        pass

    # Fallback: candidates[0].content.parts[].text
    candidates = getattr(response, "candidates", None)
    if not candidates:
        return ""
    try:
        parts = getattr(getattr(candidates[0], "content", None), "parts", None) or []
        merged = "".join([getattr(p, "text", "") for p in parts if getattr(p, "text", "")])
        return (merged or "").strip()
    except Exception:
        return ""


def _response_is_blocked(response) -> bool:
    """
    Heuristic: có candidates nhưng không có content parts -> thường do safety filter block.
    """
    if response is None:
        return False
    candidates = getattr(response, "candidates", None)
    if not candidates:
        return False
    try:
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None)
        return not parts
    except Exception:
        return True


def _get_safety_ratings(response):
    candidates = getattr(response, "candidates", None) or []
    try:
        return getattr(candidates[0], "safety_ratings", None)
    except Exception:
        return None


def _finish_reason_is_safety(response) -> bool:
    """
    SDK thường dùng finish_reason==3 để báo SAFETY (blocked).
    (Giữ check này độc lập với "parts is None" để bắt thêm case).
    """
    if response is None:
        return False
    candidates = getattr(response, "candidates", None) or []
    if not candidates:
        return False
    try:
        return getattr(candidates[0], "finish_reason", None) == 3
    except Exception:
        return False


def _normalize_vi(text: str) -> str:
    """
    Normalize tiếng Việt để match keyword ổn định khi OCR không dấu:
    - lower
    - bỏ dấu (NFKD)
    - thay ký tự không phải chữ/số thành khoảng trắng
    - gộp khoảng trắng
    """
    if not text:
        return ""
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join([c for c in text if not unicodedata.combining(c)])
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _guess_category_from_text(text: str) -> str:
    t = _normalize_vi(text)
    # bắt cả dạng có khoảng trắng và dính liền
    if ("cong van" in t) or ("congvan" in t):
        return "Công văn"
    if ("quyet dinh" in t) or ("quyetdinh" in t):
        return "Quyết định"
    if ("hop dong" in t) or ("hopdong" in t):
        return "Hợp đồng"
    # "don" cực dễ match nhầm trong cụm "don vi" (đơn vị), nên chỉ bắt pattern rõ ràng
    if (
        ("don xin" in t)
        or ("don de nghi" in t)
        or ("don khieu nai" in t)
        or ("don to cao" in t)
        or ("don tu" in t)
        or ("kinh de nghi" in t and "don" in t)
    ):
        return "Đơn từ"
    return "Khác"


def _rule_based_summary(raw_text: str, *, max_lines: int = 5) -> str:
    """
    Tóm tắt rule-based từ OCR text để UI nhìn "đẹp" khi Gemini lỗi/không trả JSON.
    Chiến lược:
    - Tách câu theo dấu câu phổ biến (., ;, :, xuống dòng)
    - Ưu tiên câu chứa keyword hành chính (V/v, Kính gửi, Căn cứ, Đề nghị, Quyết định, Thông báo...)
    - Ghép 3-5 dòng ngắn, tránh câu quá dài/ngắn
    """
    if not raw_text:
        return "Không có tóm tắt"

    text = re.sub(r"\s+", " ", raw_text).strip()
    if not text:
        return "Không có tóm tắt"

    # Sentence-ish split (OCR hay dính chữ, nên split rộng)
    chunks = [c.strip(" -\t") for c in re.split(r"[\n\r]+|[.;:]+", text) if c and c.strip()]
    if not chunks:
        return (text[:280] + ("..." if len(text) > 280 else "")).strip()

    norm_text = _normalize_vi(text)
    # keyword không dấu để match ổn định
    keywords = [
        "v v",
        "vv",
        "kinh gui",
        "can cu",
        "de nghi",
        "quyet dinh",
        "thong bao",
        "ve viec",
        "noi dung",
    ]

    def score_chunk(c: str) -> int:
        n = _normalize_vi(c)
        s = 0
        for kw in keywords:
            if kw in n:
                s += 3
        # boost nếu chunk nằm gần đầu văn bản (thường là tiêu đề/nội dung chính)
        pos = norm_text.find(_normalize_vi(c))
        if pos != -1 and pos < 400:
            s += 2
        # phạt câu quá ngắn/quá dài
        if len(c) < 25:
            s -= 2
        if len(c) > 220:
            s -= 1
        return s

    ranked = sorted(chunks, key=score_chunk, reverse=True)

    picked: list[str] = []
    seen_norm: set[str] = set()
    for c in ranked:
        if len(picked) >= max_lines:
            break
        if len(c) < 25:
            continue
        # normalize để tránh chọn trùng ý do OCR lặp
        n = _normalize_vi(c)
        if not n or n in seen_norm:
            continue
        seen_norm.add(n)
        picked.append(c)

    # Nếu không đủ câu keyword, lấy thêm vài câu đầu cho đủ 3 dòng
    if len(picked) < 3:
        for c in chunks:
            if len(picked) >= 3:
                break
            if len(c) < 25:
                continue
            n = _normalize_vi(c)
            if not n or n in seen_norm:
                continue
            seen_norm.add(n)
            picked.append(c)

    if not picked:
        return (text[:280] + ("..." if len(text) > 280 else "")).strip()

    # Format 3-5 dòng
    picked = picked[:max_lines]
    return "\n".join(picked)


def _is_complete_json_object(text: str) -> bool:
    if not text:
        return False
    t = text.strip()
    return t.startswith("{") and t.endswith("}")


def _looks_like_json_fragment(text: str) -> bool:
    """
    Detect JSON fragment / broken JSON to avoid using it as summary.
    """
    if not text:
        return False
    t = text.strip().lower()
    if t.startswith("{") and not t.endswith("}"):
        return True
    return ('"category"' in t) or ('"summary"' in t)


def clean_ocr(text: str) -> str:
    """Làm sạch và chuẩn hóa text OCR trước khi đưa vào Gemini để tránh rác."""
    if not text:
        return ""
    # 1. Loại bỏ các ký tự đặc biệt rác do OCR nhầm (chỉ giữ lại chữ, số, dấu câu cơ bản)
    text = re.sub(r'[^\w\s\.,;:\-\(\)\/\%\'\"]', ' ', text)
    # 2. Xóa khoảng trắng thừa và dấu xuống dòng liên tiếp
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    # 3. Nối các từ bị gãy dòng sai
    text = re.sub(r'([a-z])\n([a-z])', r'\1 \2', text)
    return text.strip()


import asyncio


async def _call_gemini_with_retry(payload, generation_config=None, max_retries=3):
    """
    Wrapper gọi Gemini với Retry khi gặp lỗi 429 (Rate Limit).
    Dùng synchronous generate_content để đảm bảo tương thích SDK cũ.
    """
    for attempt in range(max_retries):
        try:
            if generation_config:
                response = model.generate_content(payload, generation_config=generation_config)
            else:
                response = model.generate_content(payload)
            return response
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "quota" in err_msg.lower():
                wait_time = 8 * (attempt + 1)  # 8s, 16s, 24s
                print(f"⚠️ Gemini Rate Limit (429). Thử lại lần {attempt + 1}/{max_retries} sau {wait_time}s...")
                await asyncio.sleep(wait_time)
                continue
            print(f"❌ Gemini API Error: {e}")
            raise e
    raise RuntimeError(f"Gemini API exhausted after {max_retries} retries (rate limit)")

async def analyze_document_content(raw_text: str, image_path: str = None) -> dict:
    """Phân loại và tóm tắt văn bản (Có fallback Vision + Retry logic)"""
    
    clean_text = clean_ocr(raw_text)
    is_text_valid = clean_text and len(clean_text) > 15
    if not is_text_valid and not image_path:
        return {"category": "Khác", "summary": "Không đủ dữ liệu để AI phân tích nội dung."}

    prompt_template = """
Chỉ trả về DUY NHẤT một JSON object. KHÔNG giải thích. KHÔNG markdown.
Nhiệm vụ: Trích xuất thông tin ngữ nghĩa sâu (Deep Semantic Extraction) từ văn bản hành chính/tài liệu.

Schema bắt buộc:
{
  "category": "Quyết định|Hợp đồng|Công văn|Đơn từ|Khác",
  "document_number": "Số hiệu văn bản (vd: 2140/QĐ-UBND, N/A nếu không có)",
  "issuer": "Cơ quan/Người ban hành",
  "issued_date": "Ngày ban hành (vd: 05/09/2016, N/A nếu không có)",
  "summary_short": "Executive Summary: 1 câu duy nhất (dưới 30 từ), cực kỳ dễ hiểu tóm gọn mục đích văn bản.",
  "main_points": [
    "Điểm chính 1 (ngắn gọn)",
    "Điểm chính 2",
    "..."
  ],
  "insight": "AI Insight: 1 câu nhận định chuyên sâu về tính chất/tầm quan trọng của văn bản này.",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
  "has_signature": true,
  "has_seal": true
}
(Tuyệt đối PHẢI SỬA LỖI CHÍNH TẢ TỪ OCR, TIẾNG VIỆT CÓ DẤU CHUẨN MỰC)
""".strip()

    try:
        payload = None
        if image_path and os.path.exists(image_path):
            img = Image.open(image_path)
            prompt = f"{prompt_template}\n\nNỘI DUNG OCR ĐÃ LÀM SẠCH (hãy kết hợp đọc ảnh để khôi phục nội dung):\n{clean_text[:3000]}"
            payload = [prompt, img]
        else:
            prompt = f"{prompt_template}\n\nNỘI DUNG OCR ĐÃ LÀM SẠCH:\n{clean_text[:3000]}"
            payload = prompt

        # Plain dict config - không dùng response_mime_type (gây lỗi SDK cũ)
        gen_config = {"temperature": 0.2, "top_p": 0.8}

        # Gọi qua wrapper có retry
        response = await _call_gemini_with_retry(payload, generation_config=gen_config)

        # Nếu bị safety block -> thử fallback model (nếu có)
        if response and (fallback_model is not None) and (_response_is_blocked(response) or _finish_reason_is_safety(response)):
            response = model.generate_content(
                payload,
                generation_config={"temperature": 0.2},
            )

        raw_out = _response_to_text(response)
        if os.getenv("GEMINI_DEBUG", "").strip() in {"1", "true", "True", "yes", "YES"}:
            print(f"🧠 Gemini RAW: {raw_out!r}")
            
        parsed = _extract_json_object(raw_out)
        if parsed:
            category = parsed.get("category", "Khác")
            if category not in ["Quyết định", "Hợp đồng", "Công văn", "Đơn từ", "Khác"]:
                category = "Khác"
            
            return {
                "category": category, 
                "summary": str(parsed.get("summary_short", "Không có tóm tắt")).strip(),
                "document_number": parsed.get("document_number", "N/A"),
                "issuer": parsed.get("issuer", "N/A"),
                "issued_date": parsed.get("issued_date", "N/A"),
                "main_points": parsed.get("main_points", []),
                "insight": parsed.get("insight", ""),
                "keywords": parsed.get("keywords", []),
                "has_signature": bool(parsed.get("has_signature", False)),
                "has_seal": bool(parsed.get("has_seal", False))
            }

        # Fallback rule-based
        guessed = _guess_category_from_text(raw_text or "")
        summary_src = _rule_based_summary(raw_text or "")
        return {
            "category": guessed, "summary": summary_src,
            "document_number": "N/A", "issuer": "N/A", "issued_date": "N/A",
            "main_points": [], "insight": "", "keywords": [],
            "has_signature": False, "has_seal": False
        }
    except Exception as e:
        print(f"❌ Final Gemini Failure: {e}")
        guessed = _guess_category_from_text(raw_text or "")
        return {
            "category": guessed,
            "summary": _rule_based_summary(raw_text or ""),
            "document_number": "N/A", "issuer": "N/A", "issued_date": "N/A",
            "main_points": [], "insight": "", "keywords": [],
            "has_signature": False, "has_seal": False
        }

async def call_gemini_pure_text(prompt: str) -> str:
    """Hàm chỉ lấy text thô từ Gemini với Retry (Phục vụ AI Search)"""
    try:
        response = model.generate_content(prompt)
        return _response_to_text(response)
    except Exception as e:
        print(f"❌ Gemini Pure Text Error: {e}")
        return ""