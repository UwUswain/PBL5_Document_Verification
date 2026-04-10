import os
import re
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Cấu hình API Key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Sử dụng model Flash cho tốc độ xử lý nhanh nhất và tiết kiệm tài nguyên
model = genai.GenerativeModel('gemini-1.5-flash')

async def analyze_document_content(raw_text: str) -> dict:
    """
    Sử dụng Gemini AI để phân loại và tóm tắt văn bản hành chính.
    Kết quả trả về luôn là một dictionary gồm 'category' và 'summary'.
    """
    
    # 1. Kiểm tra đầu vào cơ bản
    if not raw_text or len(raw_text.strip()) < 10:
        return {
            "category": "Khác", 
            "summary": "Văn bản quá ngắn hoặc không đủ nội dung để AI có thể phân tích chính xác."
        }

    # 2. Xây dựng Prompt "ép" AI trả về JSON
    prompt = f"""
    Bạn là một trợ lý AI chuyên nghiệp xử lý văn bản hành chính Việt Nam.
    Hãy phân tích nội dung văn bản dưới đây:
    ---
    {raw_text}
    ---
    Nhiệm vụ:
    1. Phân loại văn bản vào một trong các nhóm: [Quyết định, Hợp đồng, Công văn, Đơn từ, Khác].
    2. Tóm tắt nội dung chính trong 3-5 dòng ngắn gọn, súc tích, nêu rõ đối tượng và mục đích của văn bản.

    Yêu cầu BẮT BUỘC trả về kết quả dưới dạng JSON duy nhất, không kèm giải thích hay ký tự thừa:
    {{
        "category": "tên nhóm",
        "summary": "nội dung tóm tắt"
    }}
    """

    try:
        # 3. Gọi AI generate nội dung
        response = model.generate_content(prompt)
        res_text = response.text

        # 4. KỸ THUẬT REGEX: Tìm đoạn nằm trong cặp ngoặc nhọn { }
        # Giúp loại bỏ mọi text thừa, markdown ```json ... ``` mà AI tự ý thêm vào
        json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
        
        if json_match:
            # Trích xuất chuỗi JSON sạch nhất có thể
            clean_json = json_match.group()
            result = json.loads(clean_json)
        else:
            # Fallback nếu AI trả về định dạng lạ không tìm thấy ngoặc nhọn
            result = {
                "category": "Khác", 
                "summary": "AI không trả về định dạng JSON chuẩn. Nội dung thô: " + res_text[:100] + "..."
            }
            
        return result
    
    except Exception as e:
        # 5. Xử lý lỗi (Mất mạng, API Key hết hạn, hoặc JSON lỗi)
        print(f"❌ AI Error (ai_service.py): {str(e)}")
        return {
            "category": "Lỗi hệ thống", 
            "summary": "Không thể phân tích nội dung văn bản do lỗi kết nối với dịch vụ AI."
        }