import asyncio
import uuid
import sys
import os

# 1. Đảm bảo Python thấy folder 'app' trong 'backend'
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

from app.db.database import AsyncSessionLocal

# --- ĐÂY LÀ CHỖ QUAN TRỌNG NHẤT ---
# Phải import User TRƯỚC Document để SQLAlchemy hiểu mối quan hệ bảng
from app.modules.users.models import User 
from app.modules.documents.models import Document
# ---------------------------------

async def test_insert_ai_data():
    print("🚀 Đang kiểm tra kết nối Database và chèn dữ liệu AI...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Tạo một bản ghi giả lập
            test_doc = Document(
                owner_id=None, # Để None nếu bro chưa tạo User nào
                file_name="demo_ai_test.pdf",
                file_path="/storage/uploads/demo.pdf",
                sha256_hash=f"test_hash_{uuid.uuid4().hex[:10]}",
                raw_text="Đây là nội dung văn bản thô đã được OCR trích xuất.",
                category="Công văn",
                summary="AI đã tóm tắt nội dung này thành công.",
                ai_results={"stamps_detected": 1, "confidence": 0.95},
                status="verified"
            )
            
            db.add(test_doc)
            await db.commit()
            print("✅ THÀNH CÔNG: Đã lưu được dữ liệu vào các cột AI mới!")
            
        except Exception as e:
            await db.rollback()
            # In ra lỗi chi tiết hơn để dễ soi
            print(f"❌ THẤT BẠI: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_insert_ai_data())