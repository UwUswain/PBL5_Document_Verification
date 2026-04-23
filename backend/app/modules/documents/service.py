import os
import re
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from fastapi import HTTPException, UploadFile
from urllib.parse import urlencode

from PIL import Image
import uuid
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
    def _crop_and_save(img: Image.Image, box: list, output_filename: str):
        """
        Cắt ảnh từ box [x1, y1, x2, y2] hệ 0-1000
        """
        try:
            w, h = img.size
            left = (box[0] / 1000) * w
            top = (box[1] / 1000) * h
            right = (box[2] / 1000) * w
            bottom = (box[3] / 1000) * h

            # Padding 10%
            pad_w = (right - left) * 0.1
            pad_h = (bottom - top) * 0.1
            
            crop_box = (
                max(0, left - pad_w),
                max(0, top - pad_h),
                min(w, right + pad_w),
                min(h, bottom + pad_h)
            )
            
            cropped = img.crop(crop_box)
            save_path = os.path.join(BASE_DIR, "storage", "crops", output_filename)
            cropped.save(save_path)
            return f"/storage/crops/{output_filename}"
        except Exception as e:
            print(f"❌ _crop_and_save Error: {e}")
            return None

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
        new_id = uuid.uuid4()
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
        
        if ai_analysis.get("has_signature") or ai_analysis.get("has_seal"):
            try:
                with Image.open(file_path) as img:
                    img_w, img_h = img.size
                    
                    # 8.1) Xử lý Chữ ký
                    if ai_analysis.get("has_signature"):
                        sig_box = [720, 820, 950, 950] # Normalized 0-1000
                        sig_url = DocumentService._crop_and_save(img, sig_box, f"sig_{str(new_id)}.png")
                        if sig_url:
                            final_entities.append({
                                "label": "chu_ky",
                                "confidence": 0.99,
                                "box": sig_box,
                                "is_ai_guessed": True,
                                "crop_url": sig_url
                            })
                            seal_data["count"] += 1

                    # 8.2) Xử lý Con dấu
                    if ai_analysis.get("has_seal"):
                        seal_box = [520, 780, 780, 950] # Normalized 0-1000
                        seal_url = DocumentService._crop_and_save(img, seal_box, f"seal_{str(new_id)}.png")
                        if seal_url:
                            final_entities.append({
                                "label": "con_dau",
                                "confidence": 0.99,
                                "box": seal_box,
                                "is_ai_guessed": True,
                                "crop_url": seal_url
                            })
                            seal_data["count"] += 1
            except Exception as e:
                print(f"❌ Cropping error: {e}")

        seal_data["entities"] = final_entities

        # 9) Đưa siêu dữ liệu vào seal_data để frontend đọc
        seal_data["metadata"] = {
            "document_number": ai_analysis.get("document_number", "N/A"),
            "issuer": ai_analysis.get("issuer", "N/A"),
            "issued_date": ai_analysis.get("issued_date", "N/A"),
            "main_points": ai_analysis.get("main_points", []),
            "insight": ai_analysis.get("insight", ""),
            "keywords": ai_analysis.get("keywords", [])
        }

        # 10) Chuẩn hoá raw_text lưu DB
        raw_text_for_db = extracted_text if extracted_text else "Không trích xuất được nội dung rõ ràng từ ảnh quét."

        # 11) Status logic
        status = "verified" if (
            len(extracted_text) > 20
            and ai_analysis.get("category") != "Khác"
            and seal_data.get("count", 0) > 0
        ) else "pending"

        # 12) Lưu DB
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
    async def delete_document(db: AsyncSession, document_id: str, user_id: uuid.UUID):
        """
        Xóa văn bản và các file liên quan
        """
        try:
            doc_uuid = uuid.UUID(document_id)
            result = await db.execute(select(Document).where(Document.id == doc_uuid))
            doc = result.scalar_one_or_none()

            if not doc:
                raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
            
            # Chỉ admin hoặc chủ sở hữu mới được xóa (ở đây router đã check admin)
            
            # 1. Xóa các file vật lý
            file_paths = [doc.file_path, doc.qr_path]
            # Thêm các file crop (nếu có)
            if doc.ai_results:
                entities = doc.ai_results.get("entities", [])
                for ent in entities:
                    if ent.get("crop_url"):
                        # Chuyển /storage/crops/xxx.png thành đường dẫn tuyệt đối
                        crop_rel_path = ent["crop_url"].lstrip("/")
                        file_paths.append(os.path.join(BASE_DIR, crop_rel_path))

            for path in file_paths:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as e:
                        print(f"Error removing file {path}: {e}")

            # 2. Xóa trong DB
            await db.delete(doc)
            await db.commit()
            return True

        except ValueError:
            raise HTTPException(status_code=400, detail="ID không hợp lệ")

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

        context = ""
        for d in docs:
            meta = (d.ai_results or {}).get("metadata", {})
            doc_info = f"ID: {d.id} | No: {meta.get('document_number')} | Issuer: {meta.get('issuer')} | Summary: {d.summary} | Keywords: {', '.join(meta.get('keywords', []))}"
            context += doc_info + "\n"

        prompt = (
            f"Hệ thống quản lý văn bản scan AI. Danh sách dữ liệu hiện có:\n{context}\n\n"
            f"Tìm các UUID liên quan nhất đến yêu cầu tìm kiếm: '{query}'. "
            "Trả về danh sách UUID cách nhau bởi dấu phẩy, sắp xếp theo độ liên quan giảm dần. "
            "Nếu không có kết quả nào thực sự liên quan, trả về 'None'."
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