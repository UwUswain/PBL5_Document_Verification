import os
import cv2
import numpy as np
import asyncio

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
                # FIX: Giải quyết lỗi PyTorch 2.6+ chặn load model (WeightsUnpickler Error)
                import torch
                from ultralytics.nn.tasks import DetectionModel
                torch.serialization.add_safe_globals([DetectionModel])
                
                # AN TOÀN TUYỆT ĐỐI: Tránh lỗi metadata của torchvision làm sập luồng chính
                from ultralytics import YOLO
                
                if not os.path.exists(MODEL_PATH):
                    if not cls._disabled:
                        print(f"⚠️ Warning: Không thấy file tại: {MODEL_PATH}. SealDetector disabled.")
                    cls._disabled = True
                    return None
                
                print(f"✅ Đang nạp model YOLO từ: {MODEL_PATH}")
                cls._model = YOLO(MODEL_PATH)
            except Exception as e:
                # Nếu thiếu torchvision hay lỗi bất kỳ, vô hiệu hóa Vision module nhưng không crash app
                print(f"⚠️ Vision Module (YOLO) bị vô hiệu hóa do lỗi thư viện.")
                print(f"💡 Gợi ý: Bạn có thể cần cài lại torchvision. Lỗi: {e}")
                cls._disabled = True
                return None
        return cls._model

    @staticmethod
    async def detect_stamps(image_path: str):
        try:
            model = SealDetector.get_model()
            if model is None:
                return {"status": "skipped", "count": 0, "entities": []}
                
            # FIX: Hỗ trợ Unicode path trên Windows
            if not os.path.exists(image_path):
                return {"status": "error", "message": "File not found"}

            img_array = np.fromfile(image_path, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if img is None:
                # Nếu là PDF, YOLOv8 không đọc trực tiếp qua imdecode được
                print(f"⚠️ YOLO skip: Không thể decode ảnh (Có thể là PDF): {image_path}")
                return {"status": "error", "count": 0, "message": "Unsupported format (PDF?)"}

            # Chạy inference trong thread để không block async loop
            print(f"🧠 [YOLO] Dự đoán cho file: {image_path}")
            results = await asyncio.to_thread(model.predict, img, conf=0.05, iou=0.3)
            
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