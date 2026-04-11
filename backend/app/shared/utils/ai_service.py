# import os
# import re
# import json
# import google.generativeai as genai
# from dotenv import load_dotenv

# load_dotenv()
# genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# model = genai.GenerativeModel('gemini-1.5-flash')

# async def analyze_document_content(raw_text: str) -> dict:
#     # 1. Kiểm tra đầu vào
#     if not raw_text or len(raw_text.strip()) < 10:
#         return {
#             "category": "Khác",
#             "summary": "Không trích xuất được nội dung từ ảnh (có thể là chữ ký hoặc ảnh không rõ chữ)."
#         }

#     prompt = f"""
# Bạn là chuyên gia phân tích văn bản hành chính Việt Nam.

# Văn bản:
# ---
# {raw_text}
# ---

# Nhiệm vụ:
# 1. Phân loại vào một trong các nhóm: [Quyết định, Hợp đồng, Công văn, Đơn từ, Khác]
# 2. Tóm tắt nội dung chính trong 2-4 dòng

# Chỉ trả về JSON:
# {{
#     "category": "...",
#     "summary": "..."
# }}
# """

#     try:
#         response = model.generate_content(prompt)
#         res_text = response.text.strip()

#         # Lấy JSON trong response
#         match = re.search(r'\{.*\}', res_text, re.DOTALL)
#         if match:
#             try:
#                 return json.loads(match.group())
#             except:
#                 pass

#         return {
#             "category": "Khác",
#             "summary": "AI trả về sai định dạng."
#         }

#     except Exception as e:
#         print(f"❌ AI Error: {str(e)}")
#         return {
#             "category": "Lỗi",
#             "summary": "Không thể kết nối AI."
#         }
import os, re, json
import google.generativeai as genai
from PIL import Image

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

async def analyze_document_content(raw_text: str, image_path: str = None) -> dict:
    prompt = """
    Bạn là chuyên gia phân tích văn bản hành chính Việt Nam.
    Hãy nhìn vào hình ảnh (hoặc nội dung) được cung cấp:
    1. Phân loại nhóm: [Quyết định, Hợp đồng, Công văn, Đơn từ, Khác].
    2. Tóm tắt nội dung chính trong 3-5 dòng rõ ràng, súc tích.
    Yêu cầu trả về JSON duy nhất: {"category": "...", "summary": "..."}
    """
    try:
        # Nếu OCR lỗi (raw_text rỗng), dùng Gemini Vision đọc ảnh trực tiếp
        if image_path and os.path.exists(image_path):
            img = Image.open(image_path)
            response = model.generate_content([prompt, img])
        else:
            response = model.generate_content([prompt, raw_text])

        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        return json.loads(json_match.group()) if json_match else {"category": "Khác", "summary": "AI đang phân tích..."}
    except Exception as e:
        print(f"❌ AI Error: {e}")
        return {"category": "Khác", "summary": "Hệ thống đang xử lý văn bản."}