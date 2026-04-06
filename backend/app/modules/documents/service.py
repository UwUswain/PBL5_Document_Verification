import os
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile

from app.modules.documents.models import Document
from app.modules.documents.ai_logic import SealDetector
from app.modules.documents.qr_logic import QRProcessor
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")
QR_DIR = os.path.join(BASE_DIR, "storage", "qrcodes")

class DocumentService:
    @staticmethod
    async def process_upload(file: UploadFile, user_id, db: AsyncSession):
        # 1. Đọc nội dung và tính Hash SHA-256
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

        # 4. CHẠY AI: Lấy kết quả trước khi tạo bản ghi DB (BƯỚC QUAN TRỌNG)
        # Phải có dòng này thì ai_data mới tồn tại để dùng ở bước sau
        ai_data = await SealDetector.detect_stamps(file_path)

        # 5. Khởi tạo Document và lưu ai_results
        new_doc = Document(
            owner_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            sha256_hash=file_hash,
            ai_results=ai_data, # <--- ai_data đã có ở bước 4
            status="verified" if ai_data.get("count", 0) > 0 else "pending"
        )
        
        db.add(new_doc)
        await db.flush() # Đẩy dữ liệu để lấy ID (UUID) từ DB
        await db.refresh(new_doc) # Cập nhật lại instance với ID mới có được sau flush()

        # 6. Tạo QR Code: Link sẽ dẫn đến trang verify.html với query param là ID của document
        # Dùng IP của bro: 192.168.100.236 và cổng Live Server 5500
        verify_url = f"http://10.19.92.116/:5500/frontend/verify.html?id={new_doc.id}"
        
        # Hàm generate_document_qr sẽ tạo ảnh QR chứa cái link verify_url này
        qr_url = await generate_document_qr(verify_url, str(new_doc.id))
        new_doc.qr_path = qr_url

        # 7. Commit toàn bộ thay đổi
        await db.commit()
        await db.refresh(new_doc)
        
        return new_doc