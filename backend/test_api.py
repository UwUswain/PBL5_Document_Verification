import google.generativeai as genai
from dotenv import load_dotenv
import os

# Tự động load API Key từ file .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env")
else:
    genai.configure(api_key=api_key)

    print("\n=== GOOGLE MODEL LIST ===")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model ID: {m.name.replace('models/', '')}")
    except Exception as e:
        print("Error with API Key or Connection:", e)
    print("==========================\n")
