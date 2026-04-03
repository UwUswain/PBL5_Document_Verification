import os
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile
from app.modules.documents.models import Document
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr

UPLOAD_DIR = "backend/storage/uploads"

class DocumentService:
    @staticmethod
    async def process_upload(file: UploadFile, user_id, db: AsyncSession):
        # 1. Đọc và tính Hash
        content = await file.read()
        file_hash = await calculate_sha256(content)
        
        # 2. Check trùng
        result = await db.execute(select(Document).where(Document.sha256_hash == file_hash))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="File này đã tồn tại!")

        # 3. Lưu file vật lý
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, f"{file_hash}{os.path.splitext(file.filename)[1]}")
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)

        # 4. Tạo bản ghi và lấy ID
        new_doc = Document(owner_id=user_id, file_name=file.filename, file_path=file_path, sha256_hash=file_hash)
        db.add(new_doc)
        await db.flush() # Đẩy lên để lấy UUID

        # 5. Tạo QR dựa trên ID
        new_doc.qr_path = await generate_document_qr(str(new_doc.id))
        
        await db.commit()
        await db.refresh(new_doc)
        return new_doc