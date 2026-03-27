import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Lấy đường dẫn tuyệt đối của chính file session.py này
# 2. .parent lùi 1 cấp (vào app/db), .parent lùi 2 cấp (vào app), .parent lùi 3 cấp (vào backend)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"

# 3. Load file .env từ đúng địa chỉ tuyệt đối vừa tìm được
load_dotenv(dotenv_path=env_path)
# ---------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

# Check nhanh để không bị lỗi 'got None' nữa
if not DATABASE_URL:
    raise ValueError(f"❌ Không tìm thấy DATABASE_URL tại: {env_path}")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    from backend.app.models.base import Base
    from backend.app.models.user import User 
    
    Base.metadata.create_all(bind=engine)
    print("✅ Đã tạo xong các bảng trong PostgreSQL!")