from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.db.database import engine # Chú ý: Đổi từ session sang database cho chuẩn Async
from app.db.session import init_db 

# 1. BƯỚC CHÈN IMPORT: Đặt cùng nhóm với các module khác
from app.modules.users.router import router as users_router
# from app.modules.auth.router import router as auth_router
# from app.modules.documents.router import router as doc_router

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f" {settings.APP_NAME} đang khởi động...")
    # 2. MỞ RA KHI SẴN SÀNG: Để tự động tạo bảng khi server chạy
    # await init_db() 
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# 3. MIDDLEWARE: Phải nằm TRƯỚC Router để xử lý quyền truy cập
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. BƯỚC CHÈN ROUTER: Nằm sau Middleware và trước Health Check
# Điều này giúp Swagger UI (docs) sắp xếp các nhóm API đẹp hơn
app.include_router(users_router, prefix="/api/users", tags=["Users Management"])
# app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(doc_router, prefix="/api/docs", tags=["Document Verification"])

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "message": "Server đang chạy mượt vai`!"}