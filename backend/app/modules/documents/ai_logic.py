import os
from ultralytics import YOLO

# 1. Lấy đường dẫn tuyệt đối đến chính folder chứa file ai_logic.py này
# CURRENT_DIR lúc này sẽ là: .../backend/app/modules/documents/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Ghép với folder weights và file best.pt
# Cách này giúp máy tìm thấy file 100% dù bro đứng ở đâu để chạy uvicorn
MODEL_PATH = os.path.join(CURRENT_DIR, "weights", "best.pt")

class SealDetector:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Kiểm tra xem file có thực sự tồn tại trước khi load để debug
            if not os.path.exists(MODEL_PATH):
                print(f"❌ ERROR: Không thấy file tại: {MODEL_PATH}")
                raise FileNotFoundError(f"Lỗi: Không tìm thấy model tại {MODEL_PATH}")
            
            print(f"✅ Đang nạp model từ: {MODEL_PATH}")
            cls._model = YOLO(MODEL_PATH)
        return cls._model

    @staticmethod
    async def detect_stamps(image_path: str):
        try:
            model = SealDetector.get_model()
            # Để conf=0.1 để demo dễ ra kết quả hơn khi mAP còn thấp
            results = model.predict(image_path, conf=0.01)
            
            detections = []
            for r in results:
                for box in r.boxes:
                    detections.append({
                        "label": model.names[int(box.cls)],
                        "confidence": float(box.conf),
                        "box": box.xyxy[0].tolist()
                    })
            
            return {
                "status": "detected" if detections else "not_found",
                "count": len(detections),
                "entities": detections
            }
        except Exception as e:
            print(f"❌ Lỗi chạy AI: {e}")
            return {"status": "error", "count": 0, "entities": []}