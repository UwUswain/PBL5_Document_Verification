import os
import re
import json
import uuid
import unicodedata
import google.generativeai as genai
import asyncio
from PIL import Image
from app.core.config import get_settings

# Cấu hình tập trung từ settings
settings = get_settings()

# Cấu hình Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

def _init_model(name: str):
    """
    Khởi tạo model Gemini với cơ chế chống lỗi 404 (Sử dụng format chuẩn SDK).
    """
    try:
        # SDK mới thường tự thêm 'models/' nên truyền tên ngắn là an toàn nhất
        clean_name = name.replace("models/", "")
        
        if settings.GEMINI_DEBUG:
            print(f"🔄 [AI Context] Đang thử nạp model: {clean_name}")
            
        model_obj = genai.GenerativeModel(clean_name)
        # Kiểm tra nhanh bằng cách gọi thuộc tính (không tốn token)
        if model_obj: return model_obj
    except Exception as e:
        if settings.GEMINI_DEBUG:
            print(f"⚠️ Không thể nạp model {name}: {e}")
        return None

# CHIẾN LƯỢC NẠP MODEL BẬC THANG (Fallback Chain)
def get_reliable_model():
    model_candidates = [
        settings.GEMINI_MODEL,
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ]
    for m_name in model_candidates:
        if not m_name: continue
        # Xóa hậu tố -latest nếu người dùng lỡ để trong .env
        clean_name = m_name.replace("-latest", "")
        m = _init_model(clean_name)
        if m: return m
    return None

model = get_reliable_model()
fallback_model = _init_model(settings.GEMINI_FALLBACK_MODEL) or _init_model("gemini-1.5-flash")

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
    if ("thong bao" in t) or ("thongbao" in t):
        return "Thông báo"
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


async def _call_gemini_with_retry(payload, generation_config=None, max_retries=3, model_obj=None):
    """
    Wrapper gọi Gemini với Retry khi gặp lỗi 429 (Rate Limit).
    """
    # Sử dụng model được truyền vào hoặc fallback về global model
    active_model = model_obj if model_obj else model
    
    for attempt in range(max_retries):
        try:
            if settings.GEMINI_DEBUG:
                print(f"🚀 [Gemini] Thử lần {attempt + 1}/{max_retries}...")
            
            if generation_config:
                response = active_model.generate_content(payload, generation_config=generation_config)
            else:
                response = active_model.generate_content(payload)
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
    """Phân loại và tóm tắt văn bản (Dùng model chỉ định: gemini-3.1-flash-lite-preview)"""
    
    # Khởi tạo model cụ thể theo yêu cầu
    local_model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")
    
    clean_text = clean_ocr(raw_text)
    is_text_valid = clean_text and len(clean_text) > 15
    if not is_text_valid and not image_path:
        return {"category": "Khác", "summary": "Không đủ dữ liệu để AI phân tích nội dung."}

    prompt_template = """
Chỉ trả về DUY NHẤT một JSON object. KHÔNG giải thích. KHÔNG markdown.
Nhiệm vụ: Trích xuất thông tin ngữ nghĩa sâu (Deep Semantic Extraction) từ văn bản hành chính/tài liệu.

Schema bắt buộc:
{
  "category": "Quyết định|Hợp đồng|Công văn|Thông báo|Đơn từ|Khác",
  "document_number": "Số hiệu văn bản (vd: 2140/QĐ-UBND, N/A nếu không có)",
  "issuer": "Cơ quan/Người ban hành",
  "issued_date": "Ngày ban hành (vd: 05/09/2016, N/A nếu không có)",
  "summary_short": "Executive Summary: Viết một đoạn văn 2-3 câu chi tiết, mạch lạc tóm gọn bối cảnh và mục đích cốt lõi của văn bản.",
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
            with open(image_path, "rb") as img_file:
                img = Image.open(img_file)
                img.load() # Load into memory before closing file
            prompt = f"{prompt_template}\n\nNỘI DUNG OCR ĐÃ LÀM SẠCH (hãy kết hợp đọc ảnh để khôi phục nội dung):\n{clean_text[:3000]}"
            payload = [prompt, img]
        else:
            prompt = f"{prompt_template}\n\nNỘI DUNG OCR ĐÃ LÀM SẠCH:\n{clean_text[:3000]}"
            payload = prompt

        # Plain dict config - không dùng response_mime_type (gây lỗi SDK cũ)
        gen_config = {"temperature": 0.2, "top_p": 0.8}

        # Gọi qua wrapper có retry, truyền local_model vào
        response = await _call_gemini_with_retry(payload, generation_config=gen_config, model_obj=local_model)

        # Nếu bị safety block -> thử fallback model (nếu có)
        if response and (fallback_model is not None) and (_response_is_blocked(response) or _finish_reason_is_safety(response)):
            response = model.generate_content(
                payload,
                generation_config={"temperature": 0.2},
            )

        raw_out = _response_to_text(response)
        if settings.GEMINI_DEBUG:
            print(f"🧠 [Gemini RAW]:\n{raw_out}\n{'-'*30}")
            
        parsed = _extract_json_object(raw_out)
        if parsed:
            category = parsed.get("category", "Khác")
            valid_categories = ["Quyết định", "Hợp đồng", "Công văn", "Thông báo", "Đơn từ", "Khác"]
            if category not in valid_categories:
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