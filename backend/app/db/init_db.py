import sys
import os
from pathlib import Path

backend_path = str(Path(__file__).resolve().parent.parent.parent)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import asyncio
from app.db.database import engine
from app.db.base import Base 

# TRIỆU TẬP Ở ĐÂY: Khi import vào đây, SQLAlchemy sẽ tự động 
# đăng ký các bảng này vào Base.metadata
from app.modules.users.models import User
from app.modules.documents.models import Document

async def init_models():
    print("🔍 Đang rà soát và tạo các bảng mới cho hệ thống PBL5...")
    async with engine.begin() as conn:
        # metadata lúc này đã biết User và Document là ai rồi
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Đã tạo bảng Documents và Users thành công!")

if __name__ == "__main__":
    asyncio.run(init_models())