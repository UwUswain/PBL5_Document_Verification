import asyncio
import uuid
import sys
import os

# 1. Khai báo để Python thấy folder 'app' bên trong 'backend'
# (Dù đã set PYTHONPATH nhưng thêm cái này cho chắc chắn)
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.db.database import AsyncSessionLocal
from app.modules.documents.models import Document

async def test_insert_ai_data():
    print("🚀 Đang kiểm tra kết nối Database và chèn dữ liệu AI...")
    
    # Tạo session kết nối tới DB
    async with AsyncSessionLocal() as db:
        try:
            # Tạo một bản ghi giả lập với các cột AI mới
            test_doc = Document(
                file_name="demo_ai_test.pdf",
                file_path="/storage/uploads/demo.pdf",
                sha256_hash=f"test_hash_{uuid.uuid4().hex[:10]}",
                # --- ĐÂY LÀ PHẦN QUAN TRỌNG: TEST CÁC CỘT MỚI ---
                raw_text="Đây là nội dung văn bản thô đã được OCR trích xuất.",
                category="Công văn",
                summary="AI đã tóm tắt nội dung này thành công.",
                ai_results={"stamps_detected": 1, "confidence": 0.95},
                status="verified"
            )
            
            db.add(test_doc)
            await db.commit()
            print("✅ THÀNH CÔNG: Đã lưu được dữ liệu vào các cột AI mới!")
            print(f"🔹 ID bản ghi vừa tạo: {test_doc.id}")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ THẤT BẠI: Lỗi khi lưu dữ liệu: {str(e)}")
            print("\n💡 Gợi ý: Kiểm tra lại xem bro đã lưu file 'models.py' sau khi thêm cột chưa?")

if __name__ == "__main__":
    asyncio.run(test_insert_ai_data())