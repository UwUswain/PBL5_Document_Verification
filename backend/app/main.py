import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.db.database import engine # Chú ý: Đổi từ session sang database cho chuẩn Async
from app.db.session import init_db 

# 1. BƯỚC CHÈN IMPORT: Đặt cùng nhóm với các module khác
from app.modules.users.router import router as users_router
from app.modules.auth.router import router as auth_router
from app.modules.documents.router import router as doc_router
# from app.modules.auth.router import router as auth_router
# from app.modules.documents.router import router as doc_router


settings = get_settings()

# 1. Xác định đường dẫn gốc của folder backend
# __file__ là path của main.py, đi ngược lên 2 cấp là tới folder backend/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__)) # app/
BASE_DIR = os.path.dirname(CURRENT_DIR) # backend/
STORAGE_PATH = os.path.join(BASE_DIR, "storage")

# 2. Tự động kiểm tra và tạo folder nếu chưa có (Tránh RuntimeError)
os.makedirs(os.path.join(STORAGE_PATH, "uploads"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_PATH, "qrcodes"), exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f" {settings.APP_NAME} đang khởi động...")
    await init_db()
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# 3. Mount với đường dẫn tuyệt đối STORAGE_PATH vừa tính được
app.mount("/storage", StaticFiles(directory=STORAGE_PATH), name="storage")
# 3. MIDDLEWARE: Phải nằm TRƯỚC Router để xử lý quyền truy cập
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả để không bị lỗi 403/Forbidden khi test UI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. ROUTER: Nằm sau Middleware và trước Health Check
# Điều này giúp Swagger UI (docs) sắp xếp các nhóm API đẹp hơn
app.include_router(users_router, prefix="/api/users", tags=["Users Management"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(doc_router, prefix="/api/docs", tags=["Document Verification"])
# app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(doc_router, prefix="/api/docs", tags=["Document Verification"])

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "message": "Server đang chạy mượt vai`!"}