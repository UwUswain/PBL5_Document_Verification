import os
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.core.security import get_current_user
from app.modules.users.models import User
from app.modules.documents.models import Document
from app.shared.utils import calculate_sha256
from app.modules.documents.schemas import DocumentOut

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
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    file_hash = await calculate_sha256(content)
    
    query = select(Document).where(Document.sha256_hash == file_hash)
    result = await db.execute(query)
    existing_doc = result.scalar_one_or_none()
    
    if existing_doc:
        raise HTTPException(
            status_code=400, 
            detail=f"File này đã tồn tại trên hệ thống với ID: {existing_doc.id}"
        )

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_hash}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

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

    return {
        "message": "Đã lưu tài liệu thành công!",
        "document_id": str(new_doc.id),
        "sha256": file_hash,
        "owner": current_user.email
    }