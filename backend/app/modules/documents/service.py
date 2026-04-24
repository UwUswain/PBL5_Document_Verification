import os
import uuid
import re
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete, case

from app.modules.documents.models import Document
from app.modules.documents.ai_logic import SealDetector
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr
from app.shared.utils.vector_service import add_document_to_vector_db, delete_from_vector_db
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
    async def create_document_pipeline(
        db: AsyncSession,
        file: UploadFile,
        user_id: uuid.UUID
    ) -> Document:
        """
        Quy trình xử lý văn bản:
        1. Hash & Check trùng
        2. Lưu file vật lý
        3. OCR trích xuất chữ
        4. AI Phân tích (Category, Summary, Entities)
        5. AI Phát hiện con dấu & Crop
        6. Lưu DB & Tạo QR
        7. Index vào Vector DB
        """
        # 1) Tính Hash và kiểm tra trùng
        file_content = await file.read()
        file_hash = calculate_sha256(file_content)
        await file.seek(0)

        existing_doc = await db.execute(select(Document).where(Document.sha256_hash == file_hash))
        if existing_doc.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Văn bản này đã tồn tại trong hệ thống")

        # 2) Lưu file vật lý
        new_id = uuid.uuid4()
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{new_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as f:
            f.write(file_content)

        # 3) OCR trích xuất nội dung
        extracted_text = await extract_text_from_image(file_path)

        # 4) AI Phân tích sâu (Category, Summary, Insight)
        ai_analysis = await analyze_document_content(extracted_text)

        # 5) AI Phát hiện con dấu & Crop (Dùng YOLO)
        seal_data = await SealDetector.detect_stamps(file_path)
        final_entities = []

        if seal_data["status"] == "detected":
            try:
                from PIL import Image
                img = Image.open(file_path)
                
                # Tạo folder crops
                CROP_DIR = os.path.join(BASE_DIR, "storage", "crops")
                os.makedirs(CROP_DIR, exist_ok=True)

                for idx, ent in enumerate(seal_data["entities"]):
                    box = ent["box"] # [x1, y1, x2, y2]
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

        # 6) Đưa siêu dữ liệu vào seal_data để frontend đọc
        seal_data["metadata"] = {
            "document_number": ai_analysis.get("document_number", "N/A"),
            "issuer": ai_analysis.get("issuer", "N/A"),
            "issued_date": ai_analysis.get("issued_date", "N/A"),
            "main_points": ai_analysis.get("main_points", []),
            "insight": ai_analysis.get("insight", ""),
            "keywords": ai_analysis.get("keywords", [])
        }

        # 7) Chuẩn hoá raw_text lưu DB
        raw_text_for_db = extracted_text if extracted_text else "Không trích xuất được nội dung rõ ràng từ ảnh quét."

        # 8) Status logic
        status = "verified" if (
            len(extracted_text) > 20
            and ai_analysis.get("category") != "Khác"
            and seal_data.get("count", 0) > 0
        ) else "pending"

        # 9) Lưu DB
        new_doc = Document(
            id=new_id,
            owner_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            sha256_hash=file_hash,
            raw_text=raw_text_for_db,
            category=ai_analysis.get("category", "Khác"),
            summary=ai_analysis.get("summary", "Không có tóm tắt"),
            ai_results=seal_data,
            status=status,
        )
        db.add(new_doc)
        await db.flush()

        # 10) QR Code
        verify_url = DocumentService._build_verify_url(new_doc.id)
        new_doc.qr_path = await generate_document_qr(verify_url, str(new_doc.id))

        await db.commit()
        await db.refresh(new_doc)

        # 11) Indexing vào Vector DB (Hybrid Search)
        try:
            vector_metadata = {
                "file_name": new_doc.file_name,
                "category": new_doc.category,
                "user_id": str(user_id)
            }
            vector_content = f"{new_doc.summary}\n\n{new_doc.raw_text[:2000]}"
            await add_document_to_vector_db(str(new_doc.id), vector_content, vector_metadata)
        except Exception as ve:
            print(f"⚠️ Vector Indexing Warning: {ve}")

        return new_doc

    @staticmethod
    async def ai_semantic_search(query: str, db: AsyncSession):
        """
        Hybrid Semantic Search:
        1. Vector Retrieval (ChromaDB) -> Lấy Top 10 ứng viên
        2. Gemini Reranking -> Sắp xếp lại dựa trên ngữ cảnh sâu
        """
        print(f"🔍 [Semantic Search] Bắt đầu tìm kiếm cho query: '{query}'")
        try:
            from app.shared.utils.vector_service import search_semantic_ids
            from app.shared.utils.ai_service import call_gemini_pure_text

            # 1. Retrieval: Tìm trong Vector DB
            candidate_ids = await search_semantic_ids(query, n_results=10)
            
            if not candidate_ids:
                res = await db.execute(select(Document).where(Document.file_name.ilike(f"%{query}%")).limit(10))
                return res.scalars().all()

            # 2. Lấy dữ liệu chi tiết
            result = await db.execute(select(Document).where(Document.id.in_(candidate_ids)))
            docs = result.scalars().all()
            
            if not docs: return []

            # 3. Reranking
            context = "\n".join([f"ID: {d.id} | Name: {d.file_name} | Summary: {d.summary}" for d in docs])
            prompt = f"Rerank danh sách văn bản dựa trên độ liên quan đến: '{query}'. Trả về danh sách UUID cách nhau bởi dấu phẩy.\n\nDanh sách:\n{context}"

            raw_res = await call_gemini_pure_text(prompt)
            target_ids = re.findall(r'[0-9a-fA-F\-]{36}', raw_res)
            
            if not target_ids: return docs

            id_to_doc = {str(d.id): d for d in docs}
            reranked_docs = [id_to_doc[tid] for tid in target_ids if tid in id_to_doc]
            for d in docs:
                if str(d.id) not in target_ids:
                    reranked_docs.append(d)

            return reranked_docs

        except Exception as e:
            print(f"❌ [Semantic Search] Lỗi Hybrid Pipeline: {e}")
            await db.rollback()
            res = await db.execute(select(Document).where(Document.file_name.ilike(f"%{query}%")).limit(10))
            return res.scalars().all()

    @staticmethod
    async def ai_semantic_search_for_user(
        query: str,
        db: AsyncSession,
        *,
        owner_id,
        candidate_limit: int = 15,
    ):
        """
        AI Hybrid Search tối ưu hiệu năng (Senior Level).
        """
        import time
        import asyncio
        from app.shared.utils.vector_service import search_semantic_ids
        from app.shared.utils.ai_service import call_gemini_pure_text
        
        start_request = time.time()
        print(f"🔍 [Search] Bắt đầu xử lý: '{query}'")

        try:
            # --- STAGE 1: Fast Vector Retrieval ---
            t0 = time.time()
            raw_candidates = await search_semantic_ids(query, n_results=30)
            t1 = time.time()
            print(f"📊 [Telemetry] Stage 1 (Vector) took: {t1 - t0:.4f}s")

            # Ngưỡng tương quan (Threshold)
            THRESHOLD = 1.2
            confident_ids = [cid for cid, dist in raw_candidates if dist < THRESHOLD]
            
            if not confident_ids:
                print("ℹ️ [Search] Không có vector đủ tốt, fallback keyword...")
                res = await db.execute(
                    select(Document).where(Document.owner_id == owner_id, Document.file_name.ilike(f"%{query}%")).limit(10)
                )
                return res.scalars().all()

            # --- STAGE 1.5: Database Fetch ---
            t2 = time.time()
            result = await db.execute(
                select(Document).where(Document.owner_id == owner_id, Document.id.in_(confident_ids))
            )
            docs = result.scalars().all()
            
            # Giữ nguyên thứ tự ưu tiên từ Vector DB
            id_to_doc = {str(d.id): d for d in docs}
            vector_ordered_docs = [id_to_doc[cid] for cid in confident_ids if cid in id_to_doc]
            t3 = time.time()
            print(f"📊 [Telemetry] DB Fetch & Order took: {t3 - t2:.4f}s")

            if not vector_ordered_docs: return []

            # --- STAGE 2: Optional Reranking (Guard with 8s Timeout) ---
            t4 = time.time()
            try:
                # Chỉ Rerank tối đa 15 ứng viên tốt nhất để tiết kiệm Token & Time
                top_candidates = vector_ordered_docs[:15]
                context = "\n".join([f"ID: {d.id} | Name: {d.file_name} | Summary: {d.summary}" for d in top_candidates])
                prompt = f"Lọc và rerank UUID liên quan đến: '{query}'. Chỉ trả UUID.\n\n{context}"

                # Thắt chặt timeout xuống 8 giây
                raw_res = await asyncio.wait_for(call_gemini_pure_text(prompt), timeout=8.0)
                
                target_ids = re.findall(r'[0-9a-fA-F\-]{36}', raw_res)
                if target_ids:
                    reranked = [id_to_doc[tid] for tid in target_ids if tid in id_to_doc]
                    if reranked:
                        print(f"📊 [Telemetry] Stage 2 (Gemini) took: {time.time() - t4:.4f}s")
                        print(f"✨ [Success] Tổng thời gian xử lý: {time.time() - start_request:.4f}s")
                        return reranked

            except (asyncio.TimeoutError, Exception) as e:
                print(f"⚠️ [Rerank] Bỏ qua Stage 2 do: {type(e).__name__}. Dùng kết quả Stage 1.")

            # Trả về kết quả Stage 1 nếu Stage 2 có vấn đề
            print(f"✅ [Final] Trả về Stage 1 results. Tổng thời gian: {time.time() - start_request:.4f}s")
            return vector_ordered_docs

        except Exception as e:
            print(f"❌ [Critical Search Error] {e}")
            await db.rollback()
            res = await db.execute(select(Document).where(Document.owner_id == owner_id).limit(5))
            return res.scalars().all()

        except Exception as e:
            print(f"❌ [Search Critical Error] {e}")
            await db.rollback()
            res = await db.execute(select(Document).where(Document.owner_id == owner_id).limit(5))
            return res.scalars().all()

        except Exception as e:
            print(f"❌ [User Search] Lỗi Hybrid Search: {e}")
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

            if not doc:
                raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
            
            file_paths = [doc.file_path, doc.qr_path]
            if doc.ai_results:
                entities = doc.ai_results.get("entities", [])
                for ent in entities:
                    if ent.get("crop_url"):
                        crop_rel_path = ent["crop_url"].lstrip("/")
                        file_paths.append(os.path.join(BASE_DIR, crop_rel_path))

            for path in file_paths:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as e:
                        print(f"Error removing file {path}: {e}")

            await delete_from_vector_db(document_id)
            await db.delete(doc)
            await db.commit()
            return True
        except Exception as e:
            print(f"❌ Delete Error: {e}")
            await db.rollback()
            return False

    @staticmethod
    async def list_my_documents(
        db: AsyncSession,
        owner_id,
        *,
        limit: int,
        offset: int,
    ):
        total = await db.scalar(select(func.count()).select_from(Document).where(Document.owner_id == owner_id))
        result = await db.execute(
            select(Document)
            .where(Document.owner_id == owner_id)
            .order_by(Document.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return (total or 0), result.scalars().all()