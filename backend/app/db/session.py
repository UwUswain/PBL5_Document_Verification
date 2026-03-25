import os
from dotenv import load_dotenv
from sqlalchemy import create_engine 
from sqlalchemy.orm import sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    from backend.app.models.base import Base
    from backend.app.models.user import User 
    
    # Base.metadata.create_all là phương thức của SQLAlchemy để tự tạo bảng
    Base.metadata.create_all(bind=engine)
    print("✅ Đã tạo xong các bảng trong PostgreSQL!")