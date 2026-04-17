import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.core.security import get_current_user, role_required
from app.modules.users.models import User
from app.modules.documents.models import Document
from app.modules.documents.service import DocumentService
from app.modules.documents.schemas import DocumentOut, DocumentPageOut

router = APIRouter()

# 1. Lấy danh sách tài liệu của user
@router.get("", response_model=DocumentPageOut)
async def get_my_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total, items = await DocumentService.list_my_documents(
        db,
        current_user.id,
        limit=limit,
        offset=offset,
    )
    return {"items": items, "meta": {"limit": limit, "offset": offset, "total": total}}


# 2. Verify public (QR)
@router.get("/verify/{document_id}", tags=["Public Verification"], response_model=DocumentOut)
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


# 3. Upload
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    return await DocumentService.process_upload(file, current_user.id, db)


# 4. AI Search (FIXED)
@router.get("/search", response_model=DocumentPageOut)
async def search_ai_documents(
    query: str, 
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tìm kiếm thông minh bằng Gemini (semantic search)
    """

    # ✅ FIX 1: chống query rỗng / spam
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập từ khóa hợp lệ")

    # ✅ FIX 2: filter theo user (QUAN TRỌNG)
    results = await DocumentService.ai_semantic_search_for_user(
        query.strip(),
        db,
        owner_id=current_user.id,
        candidate_limit=max(50, limit + offset),
    )
    total = len(results)
    items = results[offset : offset + limit]
    return {"items": items, "meta": {"limit": limit, "offset": offset, "total": total}}