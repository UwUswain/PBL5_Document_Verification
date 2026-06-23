import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy import select, func
from app.db.database import get_db
from app.core.security import get_current_user, role_required
from app.modules.users.models import User
from app.modules.documents.models import Document
from app.modules.documents.service import DocumentService
from app.modules.documents.schemas import DocumentOut, DocumentPageOut, PrivacyRequest, FolderCreateRequest, MoveDocumentRequest
from app.shared.utils.ai_service import chat_with_document_context
from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str

router = APIRouter()

# 0. Dashboard Stats
@router.get("/dashboard/stats", tags=["Dashboard"])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total documents
    doc_count = await db.execute(select(func.count(Document.id)))
    total_documents = doc_count.scalar() or 0

    # Total users
    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0

    # Error documents
    error_count = await db.execute(
        select(func.count(Document.id)).where(
            (Document.verification_status == 'FAILED') | (Document.status == 'FAILED')
        )
    )
    error_documents = error_count.scalar() or 0

    if total_documents == 0:
        extraction_rate = 100.0
    else:
        extraction_rate = round(((total_documents - error_documents) / total_documents) * 100, 1)

    return {
        "total_documents": total_documents,
        "extraction_rate": extraction_rate,
        "total_users": total_users,
        "error_documents": error_documents
    }

# 0.1 Public Documents (Cộng đồng)
@router.get("/public", response_model=DocumentPageOut)
async def get_public_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    total, items = await DocumentService.list_public_documents(db, limit, offset)
    return {"items": items, "meta": {"limit": limit, "offset": offset, "total": total}}

# 1. Lấy danh sách tài liệu của user
@router.get("", response_model=DocumentPageOut)
async def get_my_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    folder_id: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total, items = await DocumentService.list_my_documents(
        db,
        current_user.id,
        limit=limit,
        offset=offset,
        folder_id=folder_id,
        category=category
    )
    return {"items": items, "meta": {"limit": limit, "offset": offset, "total": total}}

# 1.5. Lấy danh sách tài liệu được chia sẻ (Shared With Me)
@router.get("/shared", response_model=DocumentPageOut)
async def get_shared_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    query: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total, items = await DocumentService.list_shared_documents(
        db,
        current_user.email,
        limit=limit,
        offset=offset,
        query=query
    )
    return {"items": items, "meta": {"limit": limit, "offset": offset, "total": total}}

# 1.6 Folder Management
@router.post("/folders", response_model=DocumentOut)
async def create_folder(
    data: FolderCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DocumentService.create_folder(db, current_user.id, data.name)

@router.put("/folders/{folder_id}", response_model=DocumentOut)
async def rename_folder(
    folder_id: str,
    data: FolderCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DocumentService.rename_folder(db, folder_id, current_user.id, data.name)

@router.patch("/{document_id}/move")
async def move_document(
    document_id: str,
    data: MoveDocumentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DocumentService.move_document(db, document_id, current_user.id, data.target_folder_id)

# 2. Verify public (QR)
@router.get("/verify/{public_token}", tags=["Public Verification"])
async def public_verify_document(public_token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.public_token == public_token))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu xác thực")

    return {
        "status": doc.verification_status,
        "ai_results": {
            "vision": doc.ai_results.get("vision_analysis", {}) if doc.ai_results else {},
            "nlp": {"category": doc.category}
        },
        "raw_text": (doc.raw_text[:300] + "...") if doc.raw_text and len(doc.raw_text) > 300 else doc.raw_text,
        "created_at": doc.created_at,
        "image_url": f"/storage/crops/{doc.id}.jpg" # Dummy hoặc cần URL ảnh gốc nếu muốn
    }



# 3. Upload
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DocumentService.create_document_pipeline(
        db=db,
        file=file,
        user_id=current_user.id
    )


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

# 5. Lấy danh sách cần kiểm tra (Admin Only)
@router.get("/admin/pending-review")
async def get_pending_review(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    total, items = await DocumentService.list_pending_review(db, limit, offset)
    return {"items": items, "meta": {"total": total, "limit": limit, "offset": offset}}

# 6. Xác thực thủ công (Admin Only)
@router.post("/{document_id}/manual-verify")
async def manual_verify(
    document_id: str,
    file: UploadFile = File(...),
    label_type: str = Query(..., regex="^(seal|signature)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required(["admin"]))
):
    return await DocumentService.manual_verify_document(
        db=db,
        doc_id=document_id,
        crop_file=file,
        label_type=label_type
    )

# 7. Delete Document
@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await DocumentService.delete_document(db, document_id, current_user)
    return None

# 8. Lấy chi tiết tài liệu theo ID
@router.get("/{document_id}")
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DocumentService.get_document_by_id(db, document_id, current_user)

# 9. Chat with Document
@router.post("/{document_id}/chat")
async def chat_with_document(
    document_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = await DocumentService.get_document_by_id(db, document_id, current_user)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # doc['data'] contains the document schema from the service
    metadata = doc.get("ai_results") or {}
    raw_text = doc.get("raw_text") or ""
    
    answer = await chat_with_document_context(body.question, raw_text, metadata)
    return {"answer": answer}

# 10. Update Document Privacy
@router.patch("/{document_id}/privacy")
async def update_privacy(
    document_id: str,
    body: PrivacyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DocumentService.update_privacy(db, document_id, body, current_user)