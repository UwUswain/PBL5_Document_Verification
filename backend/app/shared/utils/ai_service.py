import os
import re
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

async def analyze_document_content(raw_text: str) -> dict:
    # 1. Kiểm tra đầu vào
    if not raw_text or len(raw_text.strip()) < 5: 
        return {"category": "Khác", "summary": "Nội dung quá ngắn hoặc không có chữ để AI phân tích."}

    # 2. Prompt tối ưu
    prompt = f"""
    Bạn là một chuyên gia phân tích văn bản hành chính Việt Nam. 
    Dựa vào nội dung văn bản sau đây:
    ---
    {raw_text}
    ---
    Nhiệm vụ:
    1. Phân loại văn bản vào một trong các nhóm: [Quyết định, Hợp đồng, Công văn, Đơn từ, Khác].
    2. Tóm tắt nội dung chính trong 3-5 dòng, nêu rõ đối tượng và mục đích.

    Yêu cầu trả về JSON duy nhất:
    {{
        "category": "tên nhóm",
        "summary": "nội dung tóm tắt"
    }}
    """

    try:
        response = model.generate_content(prompt)
        res_text = response.text

        # 4. KỸ THUẬT REGEX: Lấy nội dung trong { }
        json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
        
        if json_match:
            return json.loads(json_match.group())
        
        return {"category": "Khác", "summary": "AI trả về sai định dạng."}
            
    except Exception as e:
        print(f"❌ AI Error: {str(e)}")
        return {"category": "Lỗi", "summary": "Không thể kết nối AI."}