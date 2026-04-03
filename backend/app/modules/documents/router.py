import uuid
import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.core.security import get_current_user, role_required
from app.modules.users.models import User
from app.modules.documents.models import Document
from app.modules.documents.service import DocumentService
from app.modules.documents.schemas import DocumentOut

router = APIRouter()

# 1. API Lấy danh sách tài liệu (Đã mở lại để Dashboard hiện file)
@router.get("", response_model=List[DocumentOut])
async def get_my_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Document).where(Document.owner_id == current_user.id)
    result = await db.execute(query)
    return result.scalars().all()

# 2. API Verify công khai (Cho điện thoại quét QR)
@router.get("/verify/{document_id}", tags=["Public Verification"])
async def public_verify_document(document_id: str, db: AsyncSession = Depends(get_db)):
    try:
        doc_uuid = uuid.UUID(document_id)
        result = await db.execute(select(Document).where(Document.id == doc_uuid))
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        return doc
    except ValueError:
        raise HTTPException(status_code=400, detail="Mã ID không hợp lệ")

# 3. API Upload tài liệu
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    # LOGIC CHÍNH: Đã đóng gói hết vào Service để code Router sạch đẹp
    return await DocumentService.process_upload(file, current_user.id, db)

    """
    # --- PHẦN DƯ THỪA ĐÃ COMMENT LẠI (Lấy từ logic cũ nếu cần dùng sau này) ---
    
    # 1. Đọc nội dung để tính Hash
    # content = await file.read()
    # file_hash = await calculate_sha256(content)
    
    # 2. Kiểm tra trùng lặp
    # query = select(Document).where(Document.sha256_hash == file_hash)
    # result = await db.execute(query)
    # existing_doc = result.scalar_one_or_none()
    
    # if existing_doc:
    #     raise HTTPException(
    #         status_code=400, 
    #         detail=f"File này đã tồn tại trên hệ thống với ID: {existing_doc.id}"
    #     )

    # 3. Lưu file vật lý
    # file_ext = os.path.splitext(file.filename)[1]
    # unique_filename = f"{file_hash}{file_ext}"
    # file_path = os.path.join("backend/storage/uploads", unique_filename)
    
    # async with aiofiles.open(file_path, "wb") as out_file:
    #     await out_file.write(content)

    # 4. Lưu thông tin vào Database
    # new_doc = Document(
    #     owner_id=current_user.id,
    #     file_name=file.filename,
    #     file_path=file_path,
    #     sha256_hash=file_hash,
    #     status="pending"
    # )
    # db.add(new_doc)
    # await db.commit()
    # await db.refresh(new_doc)

    # 5. Tạo mã QR dựa trên ID
    # qr_url = await generate_document_qr(str(new_doc.id))
    
    # return {
    #     "message": "Upload thành công!",
    #     "qr_url": qr_url
    # }
    # -----------------------------------------------------------------------
    """