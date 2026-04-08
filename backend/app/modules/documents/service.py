import os
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile

# Import Models
from app.modules.documents.models import Document

# Import AI & Logic Services
from app.modules.documents.ai_logic import SealDetector
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr
from app.shared.utils.ocr_service import extract_text_from_image
from app.shared.utils.ai_service import analyze_document_content
from app.shared.utils.vector_service import add_document_to_vector_db

# Cấu hình đường dẫn
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")

class DocumentService:
    @staticmethod
    async def process_upload(file: UploadFile, user_id, db: AsyncSession):
        # 1. Đọc nội dung và tính Hash SHA-256 (Định danh vật lý)
        content = await file.read()
        file_hash = await calculate_sha256(content)
        
        # 2. Kiểm tra trùng lặp trong Database
        query = select(Document).where(Document.sha256_hash == file_hash)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="File này đã tồn tại trên hệ thống!")

        # 3. Lưu file vật lý
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"{file_hash}{file_ext}")
        
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)

        # --- BẮT ĐẦU CHUỖI XỬ LÝ AI (AI PIPELINE) ---

        # Bước 4: Chạy AI nhận diện con dấu (Visual AI - YOLOv8)
        # Đây là phần để thầy thấy bro xử lý "ảnh scan" thực thụ
        seal_data = await SealDetector.detect_stamps(file_path)

        # Bước 5: Chạy OCR trích xuất văn bản (Text Extraction)
        raw_text = await extract_text_from_image(file_path)
        
        # Bước 6: Nhờ Gemini phân tích nội dung (Phân loại & Tóm tắt)
        ai_analysis = await analyze_document_content(raw_text)
        
        # 4. Khởi tạo Document và lưu toàn bộ kết quả AI vào DB
        new_doc = Document(
            owner_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            sha256_hash=file_hash,
            # Lưu các trường AI mới
            raw_text=raw_text,
            category=ai_analysis.get("category", "Khác"),
            summary=ai_analysis.get("summary", "Không có tóm tắt"),
            ai_results=seal_data, 
            # Status: Tự động Verified nếu đúng loại và có con dấu
            status="verified" if (ai_analysis.get("category") != "Khác" and seal_data.get("count", 0) > 0) else "pending"
        )
        
        db.add(new_doc)
        await db.flush() # Đẩy lên để lấy ID (UUID) phục vụ bước sau

        # Bước 7: Đẩy vào bộ nhớ Vector (Semantic Search)
        # Giúp tìm kiếm nội dung "Tìm văn bản về đất đai" thay vì tìm đúng từ khóa
        await add_document_to_vector_db(
            doc_id=str(new_doc.id),
            text=raw_text,
            metadata={
                "file_name": file.filename,
                "category": new_doc.category
            }
        )

        # Bước 8: Tạo QR Code chứng thực (Dùng IP của bro cho demo tại trường)
        # Link dẫn đến trang verify của frontend
        verify_url = f"http://192.168.100.236:5500/frontend/verify.html?id={new_doc.id}"
        qr_url = await generate_document_qr(verify_url, str(new_doc.id))
        new_doc.qr_path = qr_url

        # 9. Hoàn tất lưu trữ
        await db.commit()
        await db.refresh(new_doc)
        
        return new_doc