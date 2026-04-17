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


def _preprocess_for_ocr(img):
    """
    Preprocess ảnh trước OCR:
    - grayscale để giảm nhiễu màu
    - resize theo cạnh dài mục tiêu để OCR ổn định/tối ưu tốc độ
    """
    if img is None:
        return None

    # Grayscale
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    h, w = gray.shape[:2]
    if h == 0 or w == 0:
        return None

    long_edge = max(h, w)
    target_long_edge = 1600  # đủ chi tiết cho văn bản hành chính, vẫn nhanh

    # Chỉ resize khi quá lớn/quá nhỏ để giữ chất lượng + tốc độ
    if long_edge > 2200:
        scale = target_long_edge / float(long_edge)
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        gray = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_AREA)
    elif long_edge < 900:
        scale = 1100 / float(long_edge)
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        gray = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    return gray


async def extract_text_from_image(image_path: str) -> str:
    try:
        if not os.path.exists(image_path):
            print("❌ File không tồn tại")
            return ""

        img = cv2.imread(image_path)
        if img is None:
            print("❌ Không đọc được ảnh")
            return ""

        # ✅ Preprocess trước khi đưa vào PaddleOCR (grayscale + resize)
        img = _preprocess_for_ocr(img)
        if img is None:
            print("❌ Ảnh không hợp lệ sau preprocess")
            return ""

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