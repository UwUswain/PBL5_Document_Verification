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

# Cấu hình lưu trữ
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentService:
    @staticmethod
    def _build_verify_url(doc_id: uuid.UUID) -> str:
        return f"http://localhost:3000/verify/{doc_id}"

    @staticmethod
    async def process_upload(file, user_id, db):
        """Alias cho create_document_pipeline (Tương thích ngược)"""
        return await DocumentService.create_document_pipeline(
            db=db,
            file=file,
            user_id=user_id
        )

    @staticmethod
    async def create_document_pipeline(
        db: AsyncSession,
        file: UploadFile,
        user_id: uuid.UUID
    ) -> Document:
        """
        Quy trình xử lý văn bản chuyên sâu (Fix bug missing await).
        """
        # Đọc nội dung file
        file_content = await file.read()
        
        # FIX: Thêm await cho calculate_sha256
        file_hash = await calculate_sha256(file_content)
        
        # Quan trọng: Đưa con trỏ file về 0 để các hàm sau (nếu có) vẫn đọc được
        await file.seek(0)

        # Kiểm tra trùng lặp
        existing_doc = await db.execute(select(Document).where(Document.sha256_hash == file_hash))
        if existing_doc.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Văn bản này đã tồn tại trong hệ thống")

        new_id = uuid.uuid4()
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{new_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        # Lưu file vật lý
        with open(file_path, "wb") as f:
            f.write(file_content)

        # Xử lý OCR và AI (Đã có await)
        extracted_text = await extract_text_from_image(file_path)
        ai_analysis = await analyze_document_content(extracted_text)
        seal_data = await SealDetector.detect_stamps(file_path)
        
        final_entities = []
        if seal_data["status"] == "detected":
            try:
                from PIL import Image
                img = Image.open(file_path)
                CROP_DIR = os.path.join(BASE_DIR, "storage", "crops")
                os.makedirs(CROP_DIR, exist_ok=True)

                for idx, ent in enumerate(seal_data["entities"]):
                    box = ent["box"]
                    crop_img = img.crop(box)
                    crop_name = f"crop_{new_id}_{idx}.png"
                    crop_path = os.path.join(CROP_DIR, crop_name)
                    crop_img.save(crop_path)
                    final_entities.append({
                        "label": ent["label"],
                        "confidence": ent["confidence"],
                        "crop_url": f"/storage/crops/{crop_name}"
                    })
            except Exception as e:
                print(f"❌ Cropping error: {e}")

        seal_data["entities"] = final_entities
        seal_data["metadata"] = {
            "document_number": ai_analysis.get("document_number", "N/A"),
            "issuer": ai_analysis.get("issuer", "N/A"),
            "issued_date": ai_analysis.get("issued_date", "N/A"),
            "main_points": ai_analysis.get("main_points", []),
            "insight": ai_analysis.get("insight", ""),
            "keywords": ai_analysis.get("keywords", [])
        }

        status = "verified" if (len(extracted_text) > 20 and seal_data.get("count", 0) > 0) else "pending"

        new_doc = Document(
            id=new_id,
            owner_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            sha256_hash=file_hash,
            raw_text=extracted_text or "Không trích xuất được nội dung.",
            category=ai_analysis.get("category", "Khác"),
            summary=ai_analysis.get("summary", "Không có tóm tắt"),
            ai_results=seal_data,
            status=status,
        )
        db.add(new_doc)
        await db.flush()

        verify_url = DocumentService._build_verify_url(new_doc.id)
        new_doc.qr_path = await generate_document_qr(verify_url, str(new_doc.id))

        await db.commit()
        await db.refresh(new_doc)

        # Indexing vào Vector DB (Đã có await)
        try:
            vector_metadata = {"file_name": new_doc.file_name, "category": new_doc.category, "user_id": str(user_id)}
            vector_content = f"{new_doc.summary}\n\n{new_doc.raw_text[:2000]}"
            await add_document_to_vector_db(str(new_doc.id), vector_content, vector_metadata)
        except Exception as ve:
            print(f"⚠️ Vector Indexing Warning: {ve}")

        return new_doc

    @staticmethod
    async def ai_semantic_search_for_user(
        query: str,
        db: AsyncSession,
        *,
        owner_id,
        candidate_limit: int = 20,
    ):
        """
        Local Hybrid Search (Stage 1: Vector + Keyword | Stage 2: Local Reranker)
        Target Latency: < 1.0s. 100% Offline.
        """
        import time
        from app.shared.utils.vector_service import search_semantic_ids, local_rerank
        
        start_req = time.time()
        print(f"🔍 [Production Search] Query: '{query}'")

        try:
            # --- STAGE 1: Retrieval (Semantic) ---
            raw_candidates = await search_semantic_ids(query, n_results=30)
            if not raw_candidates:
                res = await db.execute(
                    select(Document).where(Document.owner_id == owner_id, Document.file_name.ilike(f"%{query}%")).limit(10)
                )
                return res.scalars().all()

            candidate_ids = [cid for cid, dist in raw_candidates]

            # Fetch docs
            result = await db.execute(
                select(Document).where(Document.owner_id == owner_id, Document.id.in_(candidate_ids))
            )
            docs = result.scalars().all()
            
            # --- STAGE 2: Local Reranking (Cross-Encoder) ---
            reranked_docs = await local_rerank(query, list(docs))
            
            final_docs = reranked_docs[:candidate_limit]
            
            print(f"✨ [Success] Hybrid Search completed in {time.time() - start_req:.4f}s")
            return final_docs

        except Exception as e:
            print(f"❌ [Search Error] {e}")
            await db.rollback()
            res = await db.execute(
                select(Document).where(Document.owner_id == owner_id, Document.file_name.ilike(f"%{query}%")).limit(10)
            )
            return res.scalars().all()

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: str, user_id: uuid.UUID):
        try:
            doc_uuid = uuid.UUID(document_id)
            result = await db.execute(select(Document).where(Document.id == doc_uuid))
            doc = result.scalar_one_or_none()

            if not doc: raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
            
            file_paths = [doc.file_path, doc.qr_path]
            if doc.ai_results and "entities" in doc.ai_results:
                for ent in doc.ai_results["entities"]:
                    if ent.get("crop_url"):
                        file_paths.append(os.path.join(BASE_DIR, ent["crop_url"].lstrip("/")))

            for path in file_paths:
                if path and os.path.exists(path):
                    try: os.remove(path)
                    except: pass

            await delete_from_vector_db(document_id)
            await db.delete(doc)
            await db.commit()
            return True
        except Exception as e:
            print(f"❌ Delete Error: {e}")
            await db.rollback()
            return False

    @staticmethod
    async def list_my_documents(db: AsyncSession, owner_id, *, limit: int, offset: int):
        total = await db.scalar(select(func.count()).select_from(Document).where(Document.owner_id == owner_id))
        result = await db.execute(
            select(Document).where(Document.owner_id == owner_id)
            .order_by(Document.created_at.desc()).offset(offset).limit(limit)
        )
        return (total or 0), result.scalars().all()