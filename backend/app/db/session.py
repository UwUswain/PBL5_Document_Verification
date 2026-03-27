# backend/app/db/session.py
from app.db.database import engine, AsyncSessionLocal, get_db

async def init_db():
    from app.db.base import Base
    # Import tất cả models vào đây để SQLAlchemy thấy được
    from app.modules.users.models import User
    from app.modules.documents.models import Document

    async with engine.begin() as conn:
        # Tự động tạo bảng nếu chưa có (Rất tiện khi demo cho thầy)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Hệ thống Database Async đã sẵn sàng!")