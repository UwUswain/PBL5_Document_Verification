import os
import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, UploadFile

# Import Models
from app.modules.documents.models import Document

# Import AI & Logic Services
from app.modules.documents.ai_logic import SealDetector
from app.shared.utils.hash_services import calculate_sha256
from app.shared.utils.qr_services import generate_document_qr
from app.shared.utils.ocr_service import extract_text_from_image
from app.shared.utils.ai_service import analyze_document_content

# Cấu hình đường dẫn
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")

class DocumentService:
    @staticmethod
    async def process_upload(file: UploadFile, user_id, db: AsyncSession):
        # 1. Đọc nội dung và tính Hash SHA-256
        content = await file.read()
        file_hash = await calculate_sha256(content)
        
        # 2. Kiểm tra trùng lặp
        query = select(Document).where(Document.sha256_hash == file_hash)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="File này đã tồn tại trên hệ thống!")

        # 3. Lưu file vật lý
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"{file_hash}{file_ext}")
        
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)

        # --- AI PIPELINE ---

        # Bước 4: Nhận diện con dấu (YOLOv8)
        seal_data = await SealDetector.detect_stamps(file_path)

        # Bước 5: Trích xuất văn bản (OCR)
        raw_text = await extract_text_from_image(file_path)
        
        # Bước 6: Gemini phân tích (Phân loại & Tóm tắt)
        ai_analysis = await analyze_document_content(raw_text, image_path=file_path)        
        
        # 4. Lưu vào Database
        new_doc = Document(
            owner_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            sha256_hash=file_hash,
            raw_text=raw_text,
            category=ai_analysis.get("category", "Khác"),
            summary=ai_analysis.get("summary", "Không có tóm tắt"),
            ai_results=seal_data, 
            status="verified" if (ai_analysis.get("category") != "Khác" and seal_data.get("count", 0) > 0) else "pending"
        )
        
        db.add(new_doc)
        await db.flush() 

        # --- BƯỚC 7 (CHROMA DB) ĐÃ BỊ LOẠI BỎ ---

        # Bước 8: Tạo QR Code (Dùng IP tĩnh của ông để demo)
        verify_url = f"http://192.168.100.236:5500/frontend/verify.html?id={new_doc.id}"
        qr_url = await generate_document_qr(verify_url, str(new_doc.id))
        new_doc.qr_path = qr_url

        # 9. Hoàn tất
        await db.commit()
        await db.refresh(new_doc)
        
        return new_doc

    @staticmethod
    async def ai_semantic_search(query: str, db: AsyncSession):
        """
        Thay thế ChromaDB bằng cách dùng Gemini để Reranking dựa trên Summary.
        """
        # 1. Lấy danh sách 20 văn bản gần nhất để Gemini phân tích
        result = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(20))
        docs = result.scalars().all()
        
        if not docs:
            return []

        # 2. Chuẩn bị dữ liệu cho Gemini
        # Gom danh sách: ID - Tên file - Tóm tắt
        context_list = [f"ID: {d.id} | File: {d.file_name} | Summary: {d.summary}" for d in docs]
        context_text = "\n".join(context_list)

        # 3. Prompt gửi cho Gemini
        prompt = f"""
        Bạn là trợ lý tìm kiếm văn bản thông minh. 
        Dưới đây là danh sách tóm tắt của các văn bản trong hệ thống:
        {context_text}

        Người dùng đang tìm kiếm với từ khóa/ý định: "{query}"

        Hãy chọn ra tối đa 5 văn bản phù hợp nhất. 
        Chỉ trả về danh sách UUID của các văn bản, cách nhau bởi dấu phẩy. 
        Nếu không có cái nào liên quan, hãy trả về 'None'.
        """

        try:
            # Gọi hàm Gemini (hàm này ông đã viết trong shared/utils/ai_service.py)
            # Giả sử hàm đó tên là call_gemini_pure_text
            from app.shared.utils.ai_service import call_gemini_pure_text
            raw_response = await call_gemini_pure_text(prompt)
            
            if "None" in raw_response or not raw_response:
                return []

            # 4. Trích xuất ID và lấy dữ liệu thật từ DB
            target_ids = [id.strip() for id in raw_response.split(",")]
            final_query = select(Document).where(Document.id.in_(target_ids))
            final_result = await db.execute(final_query)
            
            return final_result.scalars().all()
        except Exception as e:
            print(f"❌ Lỗi AI Search: {e}")
            # Fallback về tìm kiếm theo tên file nếu AI lỗi
            fallback_query = select(Document).where(Document.file_name.ilike(f"%{query}%"))
            res = await db.execute(fallback_query)
            return res.scalars().all()