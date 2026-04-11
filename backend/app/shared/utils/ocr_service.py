import os
import cv2

# --- FIX CRASH PADDLE 3.x ---
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK'] = 'True'

from paddleocr import PaddleOCR

_ocr_instance = None

def get_ocr_model():
    global _ocr_instance
    if _ocr_instance is None:
        print("🔄 Initializing PaddleOCR...")
        _ocr_instance = PaddleOCR(
            use_angle_cls=False,
            lang='vi'
        )
    return _ocr_instance


async def extract_text_from_image(image_path: str) -> str:
    try:
        if not os.path.exists(image_path):
            print("❌ File không tồn tại")
            return ""

        img = cv2.imread(image_path)
        if img is None:
            print("❌ Không đọc được ảnh")
            return ""

        # ✅ OCR trực tiếp ảnh màu (KHÔNG grayscale)
        model = get_ocr_model()
        result = model.ocr(img)

        if not result or not result[0]:
            print("⚠️ OCR không phát hiện text")
            return ""

        full_text = []

        for line in result[0]:
            if line and len(line) > 1:
                text = line[1][0]
                if text.strip():
                    full_text.append(text)

        final_output = " ".join(full_text)

        print(f"✅ OCR Done: {len(final_output)} chars")
        print(f"📄 TEXT PREVIEW: {final_output[:150]}")

        return final_output

    except Exception as e:
        print(f"⚠️ OCR Error but bypassing: {e}")
        return ""