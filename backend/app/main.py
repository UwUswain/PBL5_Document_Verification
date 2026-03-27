from fastapi import FastAPI, Depends, UploadFile, File
from sqlalchemy.orm import Session
from backend.app.db.session import init_db, SessionLocal
from backend.app.models.user import User
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.services.image_services import ImageProcessor
import shutil
import os

app = FastAPI(title="PBL5 Document Verification API", version="1.0.0")

# 1. Khai báo folder tĩnh để trình duyệt xem được ảnh
# Nếu ko có dòng này, bro gõ link ảnh trên web sẽ bị lỗi 404
app.mount("/static", StaticFiles(directory="frontend"), name="static")
app.mount("/storage", StaticFiles(directory="backend/storage"), name="storage")

@app.on_event("startup")
def startup_event():
    print("🚀 Đang kiểm tra và khởi tạo Database...")
    init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_index():
    return FileResponse("frontend/index.html")

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.post("/upload-seal")
async def upload_seal(file: UploadFile = File(...)):
    # Phải có chữ backend/ ở đầu
    upload_path = "backend/storage/uploads"
    processed_path = "backend/storage/processed"
    
    # Tạo folder nếu lỡ tay xóa
    for path in [upload_path, processed_path]:
        if not os.path.exists(path):
            os.makedirs(path)

    file_location = f"{upload_path}/{file.filename}"
    output_location = f"{processed_path}/proc_{file.filename}"

    # 2. Lưu ảnh gốc
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Gọi OpenCV xử lý lọc màu đỏ
    success = ImageProcessor.process_red_seal(file_location, output_location)

    if success:
        return {
            "status": "success",
            "original_url": f"/storage/uploads/{file.filename}",
            "processed_url": f"/storage/processed/proc_{file.filename}"
        }
    return {"status": "error", "message": "Xử lý ảnh thất bại"}