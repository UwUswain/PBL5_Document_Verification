import asyncio
import sys
import os

# Thêm đường dẫn để import được app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.future import select
from dotenv import load_dotenv
load_dotenv()

from app.db.session import AsyncSessionLocal
from app.modules.documents.models import Document
from app.shared.utils.vector_service import add_document_to_vector_db

async def reindex_all():
    print("Bắt đầu quá trình Re-indexing toàn bộ tài liệu vào ChromaDB...")
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document))
        docs = result.scalars().all()
        
        if not docs:
            print("Database trống, không có gì để index.")
            return

        print(f"Tìm thấy {len(docs)} tài liệu. Đang xử lý...")
        
        count = 0
        for doc in docs:
            try:
                vector_metadata = {
                    "file_name": doc.file_name,
                    "category": doc.category,
                    "user_id": str(doc.owner_id)
                }
                # Kết hợp Summary và Raw Text
                vector_content = f"{doc.summary}\n\n{doc.raw_text[:2000]}"
                
                success = await add_document_to_vector_db(str(doc.id), vector_content, vector_metadata)
                if success:
                    count += 1
                    print(f"✅ [{count}/{len(docs)}] Đã index: {doc.file_name}")
                else:
                    print(f"Thất bại khi index: {doc.file_name}")
            except Exception as e:
                print(f"❌ Lỗi xử lý {doc.file_name}: {e}")

    print(f"\nHoàn thành! Đã index thành công {count}/{len(docs)} tài liệu.")
    print("Bây giờ bạn có thể sử dụng tính năng Semantic Search với toàn bộ dữ liệu cũ.")

if __name__ == "__main__":
    asyncio.run(reindex_all())
