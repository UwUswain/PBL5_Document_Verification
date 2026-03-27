import os
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.shared.utils import calculate_sha256
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import get_current_user # Hàm bảo mật anh em mình vừa viết
from app.modules.users.models import User

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # ĐÂY LÀ Ổ KHÓA!
):
    # Tạm thời mình trả về thông báo để test nút Authorize đã nhé bro
    return {
        "message": f"Chào Admin {current_user.email}, tui đã nhận được file {file.filename}!",
        "status": "Đang chờ AI YOLOv8 quét con dấu..."
    }
    
UPLOAD_DIR = "backend/storage/uploads"

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Đọc nội dung file
    content = await file.read()
    
    # 2. Tính SHA-256 (Đảm bảo file không trùng lặp và toàn vẹn)
    file_hash = await calculate_sha256(content)
    
    # 3. Lưu file vào ổ đĩa
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_hash}{file_ext}" # Dùng hash làm tên file để tránh trùng
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    if not os.path.exists(file_path):
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)
            
    # 4. Lưu record vào Database (Bro hãy thêm logic insert Document vào đây nhé)
    
    return {
        "message": "Upload thành công!",
        "sha256": file_hash,
        "filename": unique_filename
    }