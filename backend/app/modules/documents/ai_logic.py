# app/modules/documents/ai_logic.py
import asyncio

class SealDetector:
    @staticmethod
    async def detect_stamps(image_path: str):
        """
        Mô phỏng việc chạy YOLOv8 để tìm con dấu.
        Sau này sẽ thay bằng model.predict().
        """
        # Giả lập thời gian AI xử lý (vài giây)
        await asyncio.sleep(1) 
        
        # Trả về tọa độ giả để test lưu vào trường JSON 'ai_results'
        return {
            "status": "detected",
            "count": 1,
            "entities": [
                {"label": "stamp", "confidence": 0.98, "box": [100, 200, 300, 400]}
            ]
        }
