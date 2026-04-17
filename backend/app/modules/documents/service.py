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

        # 5) YOLO detect
        try:
            seal_data = await SealDetector.detect_stamps(file_path)
        except Exception:
            seal_data = {"status": "error", "count": 0, "entities": []}

        # 6) OCR
        try:
            extracted_text = await extract_text_from_image(file_path)
        except Exception:
            extracted_text = ""
        extracted_text = (extracted_text or "").strip()

        # 7) Gemini summary
        # Nếu OCR rỗng -> ép Gemini dùng Vision bằng cách truyền raw_text=""
        try:
            ai_analysis = await analyze_document_content(
                extracted_text if extracted_text else "",
                image_path=file_path,
            )
        except Exception:
            ai_analysis = {"category": "Khác", "summary": "Hệ thống đang bận phân tích."}

        # 8) Chuẩn hoá raw_text lưu DB (giữ thông tin OCR fail để trace)
        raw_text_for_db = extracted_text if extracted_text else "Không trích xuất được nội dung rõ ràng từ ảnh quét."

        # 9) Status logic
        status = "verified" if (
            len(extracted_text) > 20
            and ai_analysis.get("category") != "Khác"
            and seal_data.get("count", 0) > 0
        ) else "pending"

        # 10) Lưu DB
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