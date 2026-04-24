import os

# 1. Lấy đường dẫn tuyệt đối đến chính folder chứa file ai_logic.py này
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "weights", "best.pt")

class SealDetector:
    _model = None
    _disabled = False

    @classmethod
    def get_model(cls):
        if cls._disabled:
            return None
            
        if cls._model is None:
            try:
                # Lazy import để tránh làm sập backend khi boot nếu torchvision lỗi
                from ultralytics import YOLO
                
                if not os.path.exists(MODEL_PATH):
                    print(f"⚠️ Warning: Không thấy file tại: {MODEL_PATH}. SealDetector disabled.")
                    cls._disabled = True
                    return None
                
                print(f"✅ Đang nạp model YOLO từ: {MODEL_PATH}")
                cls._model = YOLO(MODEL_PATH)
            except Exception as e:
                print(f"⚠️ Warning: Không thể nạp Ultralytics/YOLO (Có thể do lỗi torchvision). SealDetector sẽ bị vô hiệu hóa.")
                print(f"Chi tiết lỗi: {e}")
                cls._disabled = True
                return None
        return cls._model

    @staticmethod
    async def detect_stamps(image_path: str):
        try:
            model = SealDetector.get_model()
            if model is None:
                return {"status": "skipped", "count": 0, "entities": []}
                
            # Chạy inference
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
            print(f"❌ Lỗi chạy SealDetector: {e}")
            return {"status": "error", "count": 0, "entities": []}