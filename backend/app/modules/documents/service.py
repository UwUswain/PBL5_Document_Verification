import os
import uuid
import re
import time
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete, case

from app.modules.documents.models import Document
from app.modules.documents.ai_logic import SealDetector
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr
from app.shared.utils.vector_service import add_document_to_vector_db, delete_from_vector_db, search_semantic_ids, local_rerank
from app.shared.utils.ocr_service import extract_text_from_image
from app.shared.utils.ai_service import analyze_document_content
from app.shared.utils.path_helper import normalize_path
from app.core.config import get_settings
from app.shared.utils.pdf_helper import handle_pdf_to_image

# Cấu hình lưu trữ chuẩn (Single Source of Truth)
settings = get_settings()
STORAGE_DIR = settings.STORAGE_DIR
UPLOAD_DIR = STORAGE_DIR / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class BusinessEvaluator:
    """
    Tách biệt logic nghiệp vụ khỏi Pipeline trạng thái.
    """
    @staticmethod
    def evaluate(doc: Document) -> str:
        ai_results = doc.ai_results or {}
        vision = ai_results.get("vision_analysis", {})
        content = ai_results.get("content_analysis", {})
        
        has_visual = vision.get("found_count", 0) > 0
        doc_category = content.get("category", "Khác")
        requires_signature = doc_category in ["Công văn", "Hợp đồng", "Quyết định", "Bằng cấp", "Thông báo"]
        
        if has_visual:
            return "VERIFIED"
        elif requires_signature:
            return "SUSPICIOUS"
        return "VERIFIED"

class DocumentService:
    @staticmethod
    def _build_verify_url(doc_id: uuid.UUID) -> str:
        return f"http://localhost:3000/verify/{doc_id}"

    @staticmethod
    async def create_document_pipeline(
        db: AsyncSession,
        file: UploadFile,
        user_id: uuid.UUID
    ) -> Document:
        # [STATE: RECEIVED]
        file_content = await file.read()
        file_hash = await calculate_sha256(file_content)
        await file.seek(0)

        existing_doc = await db.execute(select(Document).where(Document.sha256_hash == file_hash))
        if existing_doc.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Văn bản này đã tồn tại trong hệ thống")

        new_id = uuid.uuid4()
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{new_id}{file_ext}"
        file_path_obj = UPLOAD_DIR / file_name 
        
        new_doc = Document(
            id=new_id,
            owner_id=user_id,
            file_name=file.filename,
            file_path=str(normalize_path(file_path_obj)),
            sha256_hash=file_hash,
            status="RECEIVED"
        )
        db.add(new_doc)
        await db.flush()

        # [STATE: PROCESSING]
        new_doc.status = "PROCESSING"
        await db.flush()
        with open(file_path_obj, "wb") as f:
            f.write(file_content)
        
        abs_file_path = str(normalize_path(file_path_obj))
        ai_input_path = handle_pdf_to_image(abs_file_path, str(STORAGE_DIR))

        # [STATE: OCR_DONE]
        try:
            extracted_text = await extract_text_from_image(ai_input_path)
            new_doc.raw_text = extracted_text
            new_doc.status = "OCR_DONE"
            await db.flush()
        except Exception as e:
            new_doc.status = "FAILED"
            await db.commit()
            raise e

        # [STATE: ENRICHING]
        new_doc.status = "ENRICHING"
        await db.flush()
        
        try:
            ai_context = await analyze_document_content(extracted_text, ai_input_path)
            visual_data = await SealDetector.detect_stamps(ai_input_path)
            
            final_entities = []
            if visual_data.get("status") == "detected":
                from PIL import Image
                img = Image.open(abs_file_path)
                CROP_DIR = STORAGE_DIR / "crops"
                os.makedirs(CROP_DIR, exist_ok=True)

                for idx, ent in enumerate(visual_data["entities"]):
                    box = ent["box"]
                    crop_img = img.crop(box)
                    crop_name = f"crop_{new_id}_{idx}.png"
                    crop_img.save(CROP_DIR / crop_name)
                    final_entities.append({
                        "label": ent["label"],
                        "confidence": ent["confidence"],
                        "crop_url": f"/storage/crops/{crop_name}"
                    })

            new_doc.ai_results = {
                "vision_analysis": {
                    "entities": final_entities,
                    "found_count": len(final_entities),
                    "model": "YOLOv8-Seal"
                },
                "content_analysis": ai_context
            }
            new_doc.category = ai_context.get("category")
            new_doc.summary = ai_context.get("summary")
            
            # [BUSINESS LOGIC SEPARATION]
            new_doc.verification_status = BusinessEvaluator.evaluate(new_doc)
            
            # [STATE: COMPLETED]
            new_doc.status = "COMPLETED"
            
            verify_url = DocumentService._build_verify_url(new_doc.id)
            new_doc.qr_path = await generate_document_qr(verify_url, str(new_doc.id))
            
            await db.commit()
            await db.refresh(new_doc)
            
            # Indexing
            try:
                await add_document_to_vector_db(str(new_doc.id), f"{new_doc.summary}\n{new_doc.raw_text[:2000]}", {"category": new_doc.category})
            except: pass
            
            return new_doc

        except Exception as e:
            new_doc.status = "FAILED"
            await db.commit()
            raise e

    @staticmethod
    async def manual_verify_document(
        db: AsyncSession,
        doc_id: str,
        crop_file: UploadFile,
        label_type: str
    ):
        result = await db.execute(select(Document).where(Document.id == uuid.UUID(doc_id)))
        doc = result.scalar_one_or_none()
        if not doc: raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

        from PIL import Image
        import io
        
        # 1. Lưu ảnh crop thủ công
        CROP_DIR = STORAGE_DIR / "crops"
        os.makedirs(CROP_DIR, exist_ok=True)
        
        crop_id = uuid.uuid4()
        crop_name = f"manual_{label_type}_{crop_id}.png"
        crop_path = CROP_DIR / crop_name
        
        contents = await crop_file.read()
        img = Image.open(io.BytesIO(contents))
        img = img.convert("RGB")
        img.save(crop_path, "PNG")
        
        # 2. Cập nhật ai_results
        ai_results = doc.ai_results or {}
        vision = ai_results.get("vision_analysis", {"entities": [], "found_count": 0})
        
        vision["entities"].append({
            "label": "signature" if label_type == "signature" else "con_dau",
            "confidence": 1.0,
            "crop_url": f"/storage/crops/{crop_name}",
            "is_manual": True
        })
        vision["found_count"] += 1
        ai_results["vision_analysis"] = vision
        doc.ai_results = ai_results
        
        # 3. Re-evaluate Business Logic
        doc.verification_status = BusinessEvaluator.evaluate(doc)
        
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def ai_semantic_search_for_user(
        query: str,
        db: AsyncSession,
        *,
        owner_id,
        candidate_limit: int = 50,
    ):
        """
        Stage 1: Fast Retrieval từ ChromaDB
        Stage 2: Rerank local bằng Cross-Encoder
        """
        from app.shared.utils.vector_service import search_semantic_ids, local_rerank
        
        # 1. Tìm IDs từ ChromaDB
        results_ids = await search_semantic_ids(query, n_results=candidate_limit)
        if not results_ids:
            return []
            
        doc_ids = [uuid.UUID(rid[0]) for rid in results_ids]
        
        # 2. Lấy data từ Postgres (chỉ lấy của đúng User)
        stmt = select(Document).where(
            Document.id.in_(doc_ids),
            Document.owner_id == owner_id
        )
        db_result = await db.execute(stmt)
        docs = db_result.scalars().all()
        
        if not docs:
            return []
            
        # 3. Rerank bằng Cross-Encoder
        final_docs = await local_rerank(query, list(docs))
        return final_docs

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: str, current_user):
        from app.shared.utils.vector_service import delete_from_vector_db
        stmt = select(Document).where(Document.id == uuid.UUID(document_id))
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()
        
        if not doc:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
            
        if doc.owner_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Không có quyền xóa tài liệu này")
        
        # Xóa file vật lý (tùy chọn, ở đây giữ lại backup hoặc xóa hẳn)
        # try: os.remove(doc.file_path) except: pass
        
        # Xóa khỏi Vector DB
        await delete_from_vector_db(str(doc.id))
        
        # Xóa khỏi Postgres
        await db.delete(doc)
        await db.commit()
        return True

    @staticmethod
    async def list_my_documents(db: AsyncSession, owner_id, *, limit: int, offset: int):
        total = await db.scalar(select(func.count()).select_from(Document).where(Document.owner_id == owner_id))
        result = await db.execute(
            select(Document).where(Document.owner_id == owner_id)
            .order_by(Document.created_at.desc()).offset(offset).limit(limit)
        )
        return (total or 0), result.scalars().all()

    @staticmethod
    async def list_pending_review(db: AsyncSession, limit: int, offset: int):
        """Lấy danh sách các văn bản cần Admin kiểm tra thủ công"""
        query = select(Document).where(
            Document.status == "COMPLETED",
            Document.verification_status == "SUSPICIOUS"
        ).order_by(Document.created_at.desc()).offset(offset).limit(limit)
        
        count_query = select(func.count()).select_from(Document).where(
            Document.status == "COMPLETED",
            Document.verification_status == "SUSPICIOUS"
        )
        
        total = await db.scalar(count_query)
        result = await db.execute(query)
        return (total or 0), result.scalars().all()

    @staticmethod
    async def list_public_documents(db: AsyncSession, limit: int, offset: int):
        from app.modules.users.models import User
        
        query = select(Document, User.full_name).join(
            User, Document.owner_id == User.id
        ).where(
            Document.is_public == True,
            Document.status == "COMPLETED"
        ).order_by(Document.created_at.desc()).offset(offset).limit(limit)
        
        count_query = select(func.count()).select_from(Document).where(
            Document.is_public == True, 
            Document.status == "COMPLETED"
        )
        
        total = await db.scalar(count_query)
        result = await db.execute(query)
        
        rows = result.all()
        items = []
        for doc, full_name in rows:
            # Ẩn danh một phần tên (Vd: Lê Văn A -> L*** A)
            parts = full_name.split()
            if len(parts) >= 2:
                hidden_name = f"{parts[0]} *** {parts[-1]}"
            else:
                hidden_name = full_name
                
            doc_out = {
                "id": doc.id,
                "file_name": doc.file_name,
                "sha256_hash": doc.sha256_hash,
                "status": doc.status,
                "category": doc.category,
                "summary": doc.summary,
                "ai_results": doc.ai_results,
                "file_path": doc.file_path,
                "qr_path": doc.qr_path,
                "created_at": doc.created_at,
                "updated_at": doc.updated_at,
                "owner_name": hidden_name
            }
            items.append(doc_out)
            
        return (total or 0), items

    @staticmethod
    async def get_document_by_id(db: AsyncSession, doc_id: str, current_user):
        from app.modules.users.models import User
        
        query = select(Document, User.full_name).join(
            User, Document.owner_id == User.id
        ).where(
            Document.id == uuid.UUID(doc_id)
        )
        
        result = await db.execute(query)
        row = result.first()
        
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
            
        doc, full_name = row
        
        # Security check: Only owner or admin can view private documents
        if not doc.is_public and doc.owner_id != current_user.id and current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem tài liệu này")
            
        return {
            "id": doc.id,
            "file_name": doc.file_name,
            "sha256_hash": doc.sha256_hash,
            "status": doc.status,
            "verification_status": doc.verification_status,
            "category": doc.category,
            "summary": doc.summary,
            "ai_results": doc.ai_results,
            "raw_text": doc.raw_text,
            "file_path": doc.file_path,
            "qr_path": doc.qr_path,
            "public_token": doc.public_token,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "owner_name": full_name,
            "is_public": doc.is_public
        }