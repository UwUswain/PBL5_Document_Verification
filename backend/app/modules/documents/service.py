import os
import re
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from fastapi import HTTPException, UploadFile
from urllib.parse import urlencode

from app.modules.documents.models import Document
from app.modules.documents.ai_logic import SealDetector
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr
from app.shared.utils.ocr_service import extract_text_from_image
from app.shared.utils.ai_service import analyze_document_content

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")

class DocumentService:
    @staticmethod
    def _build_verify_url(document_id) -> str:
        """
        Frontend verify page URL (configurable via env).
        Example: FRONTEND_VERIFY_URL=http://localhost:5500/frontend/verify.html
        """
        base = os.getenv("FRONTEND_VERIFY_URL", "http://localhost:5500/frontend/verify.html").strip()
        if not base:
            base = "http://localhost:5500/frontend/verify.html"
        joiner = "&" if "?" in base else "?"
        return f"{base}{joiner}{urlencode({'id': str(document_id)})}"

    @staticmethod
    async def process_upload(file: UploadFile, user_id, db: AsyncSession):
        # Backward-compatible entrypoint
        return await DocumentService.create_document_pipeline(file=file, user_id=user_id, db=db)

    @staticmethod
    async def create_document_pipeline(file: UploadFile, user_id, db: AsyncSession):
        """
        Pipeline chuẩn:
        Nhận file -> Hash -> Lưu Disk -> YOLO detect -> OCR -> Gemini Summary (Vision nếu OCR rỗng) -> Lưu DB
        """
        # 1) Nhận file bytes
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="File rỗng hoặc không đọc được.")

        # 2) Hash
        file_hash = await calculate_sha256(content)

        # 3) Chống trùng trong DB
        result = await db.execute(select(Document).where(Document.sha256_hash == file_hash))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Văn bản này đã tồn tại trên hệ thống!")

        # 4) Lưu disk
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(file.filename or "")[1]
        file_path = os.path.join(UPLOAD_DIR, f"{file_hash}{ext}")
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        # 5) TẮT YOLO branch theo yêu cầu của user
        # Không gọi SealDetector.detect_stamps nữa vì model hiện tại nhận diện ra nhiễu (confidence ~ 0.01)
        seal_data = {"status": "detected", "count": 0, "entities": []}

        # 6) OCR
        try:
            extracted_text = await extract_text_from_image(file_path)
        except Exception:
            extracted_text = ""
        extracted_text = (extracted_text or "").strip()

        # 7) Gemini summary (Hoàn toàn đảm nhận vai trò AI Insight)
        try:
            ai_analysis = await analyze_document_content(
                extracted_text if extracted_text else "",
                image_path=file_path,
            )
        except Exception:
            ai_analysis = {"category": "Khác", "summary": "Hệ thống đang bận phân tích.", "has_signature": False, "has_seal": False}

        # 8) Dựa HOÀN TOÀN vào kết quả của Gemini để hiển thị
        final_entities = []
        
        # Đọc kích thước ảnh để đặt hộp giả lập (Fake Box) ở vị trí chuẩn
        try:
            with Image.open(file_path) as im:
                w, h = im.size
        except Exception:
            w, h = 640, 640
            
        if ai_analysis.get("has_signature"):
            final_entities.append({
                "label": "chu_ky",
                "confidence": 0.99,
                "box": [w * 0.7, h * 0.75, w * 0.95, h * 0.85], # Góc phải dưới
                "is_ai_guessed": True
            })
            seal_data["count"] += 1

        if ai_analysis.get("has_seal"):
            final_entities.append({
                "label": "con_dau",
                "confidence": 0.99,
                "box": [w * 0.65, h * 0.8, w * 0.85, h * 0.95], # Góc phải dưới
                "is_ai_guessed": True
            })
            seal_data["count"] += 1

        seal_data["entities"] = final_entities

        # 9) Chuẩn hoá raw_text lưu DB
        raw_text_for_db = extracted_text if extracted_text else "Không trích xuất được nội dung rõ ràng từ ảnh quét."

        # 10) Status logic
        status = "verified" if (
            len(extracted_text) > 20
            and ai_analysis.get("category") != "Khác"
            and seal_data.get("count", 0) > 0
        ) else "pending"

        # 11) Lưu DB
        new_doc = Document(
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

        # 11) QR Code
        verify_url = DocumentService._build_verify_url(new_doc.id)
        new_doc.qr_path = await generate_document_qr(verify_url, str(new_doc.id))

        await db.commit()
        await db.refresh(new_doc)
        return new_doc

    @staticmethod
    async def ai_semantic_search(query: str, db: AsyncSession):
        """Tìm kiếm thông minh dùng Gemini Reranking trên 20 bản ghi mới nhất"""
        result = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(20))
        docs = result.scalars().all()
        if not docs: return []

        context = "\n".join([f"ID: {d.id} | Summary: {d.summary}" for d in docs])
        prompt = f"Danh sách:\n{context}\n\nTìm UUID liên quan nhất đến: '{query}'. Trả về danh sách UUID cách nhau bởi dấu phẩy. Nếu không có, trả về 'None'."

        try:
            from app.shared.utils.ai_service import call_gemini_pure_text
            raw_res = await call_gemini_pure_text(prompt)
            if "None" in raw_res or not raw_res: return []

            # ✅ FIX: Dùng Regex tìm UUID chuẩn để tránh lỗi split
            target_ids = re.findall(r'[0-9a-fA-F\-]{36}', raw_res)
            if not target_ids: return []

            final_res = await db.execute(select(Document).where(Document.id.in_(target_ids)))
            return final_res.scalars().all()
        except Exception as e:
            print(f"❌ Search Error: {e}")
            # Fallback về search LIKE
            res = await db.execute(select(Document).where(Document.file_name.ilike(f"%{query}%")))
            return res.scalars().all()

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

    @staticmethod
    async def ai_semantic_search_for_user(
        query: str,
        db: AsyncSession,
        *,
        owner_id,
        candidate_limit: int = 50,
    ):
        """
        AI rerank trong phạm vi tài liệu của user (tránh leak + tối ưu SQL).
        """
        result = await db.execute(
            select(Document)
            .where(Document.owner_id == owner_id)
            .order_by(Document.created_at.desc())
            .limit(candidate_limit)
        )
        docs = result.scalars().all()
        if not docs:
            return []

        context = "\n".join([f"ID: {d.id} | Summary: {d.summary}" for d in docs])
        prompt = (
            f"Danh sách:\n{context}\n\n"
            f"Tìm UUID liên quan nhất đến: '{query}'. "
            "Trả về danh sách UUID cách nhau bởi dấu phẩy. Nếu không có, trả về 'None'."
        )

        try:
            from app.shared.utils.ai_service import call_gemini_pure_text

            raw_res = await call_gemini_pure_text(prompt)
            if not raw_res or "None" in raw_res:
                return []

            target_ids = re.findall(r"[0-9a-fA-F\-]{36}", raw_res)
            if not target_ids:
                return []

            ordering = case({tid: idx for idx, tid in enumerate(target_ids)}, value=Document.id)
            final_res = await db.execute(
                select(Document)
                .where(Document.owner_id == owner_id, Document.id.in_(target_ids))
                .order_by(ordering)
            )
            return final_res.scalars().all()
        except Exception as e:
            print(f"❌ Search Error: {e}")
            res = await db.execute(
                select(Document).where(Document.owner_id == owner_id, Document.file_name.ilike(f"%{query}%"))
            )
            return res.scalars().all()