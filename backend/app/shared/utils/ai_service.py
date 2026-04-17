import os
import re
import json
import uuid
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv
load_dotenv()

# Cấu hình Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Model name có thể thay đổi theo thời gian; ưu tiên đọc từ env để dễ deploy
_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
try:
    model = genai.GenerativeModel(_MODEL_NAME)
except Exception as e:
    # Fallback an toàn để hệ thống không chết khi Google đổi tên model
    print(f"❌ Gemini model init error for '{_MODEL_NAME}': {e}")
    model = genai.GenerativeModel("gemini-flash-latest")

def _extract_json_object(text: str) -> dict | None:
    if not text:
        return None
    text = text.strip()
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
        return None
    try:
        parsed = json.loads(json_match.group())
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        return None
    return None


async def analyze_document_content(raw_text: str, image_path: str = None) -> dict:
    """Phân loại và tóm tắt văn bản (Có fallback Vision)"""
    
    # FIX: Chặn spam AI nếu text quá ngắn và không có ảnh
    is_text_valid = raw_text and len(raw_text.strip()) > 15
    if not is_text_valid and not image_path:
        return {"category": "Khác", "summary": "Không đủ dữ liệu để AI phân tích nội dung."}

    prompt = """
Bạn là hệ thống trích xuất thông tin từ văn bản hành chính Việt Nam.

NHIỆM VỤ:
- Phân loại đúng 1 trong các nhóm: "Quyết định", "Hợp đồng", "Công văn", "Đơn từ", "Khác".
- Tóm tắt nội dung chính 3-5 dòng, rõ ràng, tiếng Việt.

RÀNG BUỘC ĐẦU RA (BẮT BUỘC):
- Chỉ được trả về 1 JSON object duy nhất, KHÔNG markdown, KHÔNG giải thích.
- JSON phải có đúng 2 key: "category" và "summary".
- "category" phải là một trong 5 giá trị cho phép ở trên.

VÍ DỤ (few-shot):
Input:
"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM... QUYẾT ĐỊNH. V/v bổ nhiệm ông Nguyễn Văn A giữ chức..."
Output:
{"category":"Quyết định","summary":"Văn bản là quyết định về việc bổ nhiệm nhân sự.\nNêu rõ họ tên người được bổ nhiệm và chức vụ.\nQuy định hiệu lực và trách nhiệm thi hành."}

Input:
"HỢP ĐỒNG DỊCH VỤ... Bên A... Bên B... Điều 1: Phạm vi công việc... Điều 2: Giá trị hợp đồng..."
Output:
{"category":"Hợp đồng","summary":"Hợp đồng dịch vụ giữa các bên A và B.\nQuy định phạm vi công việc, thời hạn, và nghĩa vụ các bên.\nNêu giá trị hợp đồng, phương thức thanh toán và điều khoản chung."}

Input:
"Kính gửi: ... V/v đề nghị cung cấp hồ sơ... Căn cứ... Đề nghị quý đơn vị phối hợp..."
Output:
{"category":"Công văn","summary":"Công văn gửi cơ quan/đơn vị liên quan về việc đề nghị cung cấp/ phối hợp xử lý hồ sơ.\nNêu căn cứ, nội dung đề nghị và thời hạn phản hồi.\nThông tin liên hệ và trách nhiệm thực hiện."}

Giờ hãy trả JSON cho Input dưới đây.
"""

    try:
        # Nếu OCR fail nhưng có ảnh, dùng Vision để "cứu"
        if image_path and os.path.exists(image_path) and not is_text_valid:
            img = Image.open(image_path)
            response = model.generate_content(
                [prompt, img],
                generation_config={"temperature": 0.2, "max_output_tokens": 256, "response_mime_type": "application/json"},
            )
        else:
            response = model.generate_content(
                [prompt, raw_text],
                generation_config={"temperature": 0.2, "max_output_tokens": 256, "response_mime_type": "application/json"},
            )

        parsed = _extract_json_object(getattr(response, "text", ""))
        if parsed:
            # Guardrails: normalize/validate minimal schema
            category = parsed.get("category", "Khác")
            if category not in ["Quyết định", "Hợp đồng", "Công văn", "Đơn từ", "Khác"]:
                category = "Khác"
            summary = parsed.get("summary") or "Không có tóm tắt"
            return {"category": category, "summary": str(summary).strip()}
        
        return {"category": "Khác", "summary": "Nội dung đã được lưu, AI trả về định dạng không chuẩn."}

    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return {"category": "Khác", "summary": "AI đang bận, vui lòng kiểm tra lại sau."}

async def call_gemini_pure_text(prompt: str) -> str:
    """Hàm chỉ lấy text thô từ Gemini (Phục vụ AI Search)"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"❌ Gemini Pure Text Error: {e}")
        return ""