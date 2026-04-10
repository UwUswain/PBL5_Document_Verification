import os
import cv2
import numpy as np
from paddleocr import PaddleOCR

os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'
_ocr_instance = None

def get_ocr_model():
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = PaddleOCR(use_angle_cls=True, lang='vi')
    return _ocr_instance

async def extract_text_from_image(image_path: str) -> str:
    try:
        if not os.path.exists(image_path): return ""

        img = cv2.imread(image_path)
        if img is None: return ""

        # Tiền xử lý (đã fix lỗi channel ở bước trước)
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        _, processed_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        temp_path = image_path + "_ocr.png"
        cv2.imwrite(temp_path, processed_img)

        # --- CHẠY OCR (ĐÃ BỎ cls=True) ---
        ocr_model = get_ocr_model()
        result = ocr_model.ocr(temp_path) # <--- CHỈ ĐỂ NHƯ NÀY
        
        if os.path.exists(temp_path): os.remove(temp_path)

        if not result or not result[0]:
            print("⚠️ OCR không tìm thấy chữ.")
            return ""

        # Lấy text
        full_text = []
        for page in result:
            if page is None: continue
            for line in page:
                if isinstance(line, list) and len(line) > 1:
                    text_content = line[1][0]
                    full_text.append(text_content)
            
        final_text = " ".join(full_text)
        print(f"✅ OCR THÀNH CÔNG: {len(final_text)} ký tự.")
        return final_text

    except Exception as e:
        print(f"❌ Lỗi OCR Service: {str(e)}")
        return ""