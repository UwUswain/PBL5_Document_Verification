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

# Cấu hình lưu trữ chuẩn (Single Source of Truth)
settings = get_settings()
STORAGE_DIR = settings.STORAGE_DIR
UPLOAD_DIR = STORAGE_DIR / "uploads"
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
        Quy trình xử lý văn bản (Đảm bảo Type Safety cho DB).
        """
        # Đọc nội dung file
        file_content = await file.read()
        file_hash = await calculate_sha256(file_content)
        await file.seek(0)

        # Kiểm tra trùng lặp
        existing_doc = await db.execute(select(Document).where(Document.sha256_hash == file_hash))
        if existing_doc.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Văn bản này đã tồn tại trong hệ thống")

        new_id = uuid.uuid4()
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{new_id}{file_ext}"
        file_path_obj = UPLOAD_DIR / file_name 

        # Lưu file vật lý
        with open(file_path_obj, "wb") as f:
            f.write(file_content)
            f.flush()
            os.fsync(f.fileno())

        # CHUẨN HÓA ĐƯỜNG DẪN SANG CHUỖI (Type Safety for DB)
        abs_file_path = normalize_path(file_path_obj)
        print(f"🔬 [AI Pipeline] Đang kiểm tra file: {abs_file_path}")
        
        # 1. Trích xuất Text (OCR) - Bước cơ bản nhất
        try:
            extracted_text = await extract_text_from_image(abs_file_path)
        except Exception as e:
            print(f"❌ OCR Pipeline Error: {e}")
            extracted_text = ""

        # 2. Phân tích nội dung (Gemini)
        try:
            ai_context = await analyze_document_content(extracted_text, abs_file_path)
        except Exception as e:
            print(f"❌ Gemini AI Error: {e}")
            ai_context = {"category": "Khác", "summary": "Không thể phân tích nội dung do lỗi AI."}
        
        # 3. Nhận diện thị giác (YOLO)
        try:
            visual_data = await SealDetector.detect_stamps(abs_file_path)
        except Exception as e:
            print(f"❌ Vision AI Error: {e}")
            visual_data = {"status": "skipped", "count": 0, "entities": []}
        
        final_entities = []
        if visual_data.get("status") == "detected":
            try:
                from PIL import Image
                img = Image.open(abs_file_path)
                CROP_DIR = STORAGE_DIR / "crops"
                os.makedirs(CROP_DIR, exist_ok=True)

                for idx, ent in enumerate(visual_data["entities"]):
                    box = ent["box"]
                    crop_img = img.crop(box)
                    crop_name = f"crop_{new_id}_{idx}.png"
                    crop_path = CROP_DIR / crop_name
                    crop_img.save(crop_path)
                    final_entities.append({
                        "label": ent["label"],
                        "confidence": ent["confidence"],
                        "crop_url": f"/storage/crops/{crop_name}"
                    })
            except Exception as e:
                print(f"❌ Cropping error: {e}")

        # 3. Decision Engine: Phân tích sự nhất quán giữa CV và NLP
        has_visual_evidence = visual_data.get("count", 0) > 0
        doc_category = ai_context.get("category", "Khác")
        requires_signature = doc_category in ["Công văn", "Hợp đồng", "Quyết định", "Bằng cấp"]
        
        # Logic xác thực Deterministic (Chống Hallucination từ Gemini)
        if has_visual_evidence:
            final_status = "verified"
        elif requires_signature and not has_visual_evidence:
            final_status = "suspicious" # Cảnh báo: Văn bản quan trọng nhưng không thấy dấu/chữ ký
        else:
            final_status = "pending"

        # Gộp kết quả AI chuẩn hóa vào Database
        ai_final_results = {
            "vision_analysis": {
                "entities": final_entities,
                "found_count": visual_data.get("count", 0),
                "model": "YOLOv8-Seal"
            },
            "content_analysis": ai_context, 
            "verification_logic": {
                "requires_signature": requires_signature,
                "has_visual_evidence": has_visual_evidence,
                "note": "Nghi vấn giả mạo hoặc thiếu dấu" if (requires_signature and not has_visual_evidence) else "Hợp lệ"
            }
        }

        # ĐẢM BẢO CHỈ TRUYỀN STRING VÀO DATABASE
        new_doc = Document(
            id=new_id,
            owner_id=user_id,
            file_name=file.filename,
            file_path=abs_file_path,
            sha256_hash=file_hash,
            raw_text=extracted_text or "Không trích xuất được nội dung.",
            category=doc_category,
            summary=ai_context.get("summary", "Không có tóm tắt"),
            ai_results=ai_final_results,
            status=final_status,
        )
        db.add(new_doc)
        await db.flush()

        verify_url = DocumentService._build_verify_url(new_doc.id)
        new_doc.qr_path = await generate_document_qr(verify_url, str(new_doc.id))

        # Safety Check trước khi commit
        assert isinstance(new_doc.file_path, str), f"file_path must be str, got {type(new_doc.file_path)}"
        assert isinstance(new_doc.qr_path, str), f"qr_path must be str, got {type(new_doc.qr_path)}"
        
        await db.commit()
        await db.refresh(new_doc)

        # Indexing vào Vector DB
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
            
            # Xóa file vật lý (Chuẩn hóa đường dẫn trước khi kiểm tra)
            file_paths = [normalize_path(doc.file_path), normalize_path(doc.qr_path)]
            if doc.ai_results and "entities" in doc.ai_results:
                for ent in doc.ai_results["entities"]:
                    if ent.get("crop_url"):
                        relative_path = ent["crop_url"].replace("/storage/", "")
                        file_paths.append(normalize_path(STORAGE_DIR / relative_path))

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