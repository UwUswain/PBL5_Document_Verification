import os
from paddleocr import PaddleOCR

# Khởi tạo model OCR (Nên để ngoài hàm để không phải load lại model mỗi lần gọi)
# lang='vi' giúp nhận diện tiếng Việt chính xác nhất
ocr = PaddleOCR(use_angle_cls=True, lang='vi', show_log=False)

async def extract_text_from_image(image_path: str) -> str:
    """
    Trích xuất toàn bộ văn bản từ file ảnh scan.
    """
    try:
        if not os.path.exists(image_path):
            return ""

        # Chạy OCR
        result = ocr.ocr(image_path, cls=True)
        
        if not result or result[0] is None:
            return ""

        # Hợp nhất các dòng chữ lại thành một đoạn văn bản thô
        lines = []
        for line in result[0]:
            text = line[1][0] # Nội dung chữ
            lines.append(text)
            
        return " ".join(lines)
    
    except Exception as e:
        print(f"❌ Lỗi OCR Service: {str(e)}")
        return ""