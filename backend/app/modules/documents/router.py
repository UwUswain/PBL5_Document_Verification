import os
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.documents.models import Document
from app.shared.utils import calculate_sha256

router = APIRouter()

UPLOAD_DIR = "backend/storage/uploads"

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Đọc nội dung để tính Hash
    content = await file.read()
    file_hash = await calculate_sha256(content)
    
    # 2. Kiểm tra xem file này đã tồn tại trong hệ thống chưa (tránh trùng lặp)
    query = select(Document).where(Document.sha256_hash == file_hash)
    result = await db.execute(query)
    existing_doc = result.scalar_one_or_none()
    
    if existing_doc:
        raise HTTPException(
            status_code=400, 
            detail=f"File này đã tồn tại trên hệ thống với ID: {existing_doc.id}"
        )

    # 3. Lưu file vật lý vào ổ đĩa
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_hash}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

    # 4. Lưu thông tin vào Database
    new_doc = Document(
        owner_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        sha256_hash=file_hash,
        status="pending" # Chờ YOLOv8 quét ở bước sau
    )
    
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    return {
        "message": "Đã lưu tài liệu thành công!",
        "document_id": str(new_doc.id),
        "sha256": file_hash,
        "owner": current_user.email
    }