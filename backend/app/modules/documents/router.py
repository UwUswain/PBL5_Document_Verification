import os
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.core.security import get_current_user
from app.core.security import role_required
from app.modules.users.models import User
from app.modules.documents.models import Document
from app.modules.documents.service import DocumentService
from app.shared.utils import calculate_sha256
from app.modules.documents.schemas import DocumentOut
from app.shared.utils.qr_services import generate_document_qr
from backend.app import db

router = APIRouter()

UPLOAD_DIR = "backend/storage/uploads"

# 1. API Lấy danh sách tài liệu (GET)
@router.get("/", response_model=List[DocumentOut])
async def get_my_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy toàn bộ tài liệu mà Admin hiện tại đã upload"""
    query = select(Document).where(Document.owner_id == current_user.id)
    result = await db.execute(query)
    documents = result.scalars().all()
    return documents

# 2. API Upload tài liệu (POST)
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    # 1. Đọc nội dung để tính Hash
    return await DocumentService.process_upload(file, current_user.id, db)
    
    # 2. Kiểm tra trùng lặp
    query = select(Document).where(Document.sha256_hash == file_hash)
    result = await db.execute(query)
    existing_doc = result.scalar_one_or_none()
    
    if existing_doc:
        raise HTTPException(
            status_code=400, 
            detail=f"File này đã tồn tại trên hệ thống với ID: {existing_doc.id}"
        )

    # 3. Lưu file vật lý
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
        status="pending"
    )
    
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    #qr
    # 5. Tạo mã QR dựa trên ID vừa có từ database
    qr_url = await generate_document_qr(str(new_doc.id))

    return {
        "message": "Upload & Tạo QR thành công!",
        "document_id": str(new_doc.id),
        "sha256": file_hash,
        "owner": current_user.email,
        "qr_url": qr_url  # Trả về link này để Frontend hiển thị QR ngay lập tức
    }