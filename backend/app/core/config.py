from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # 1. Thông tin chung
    APP_NAME: str = "PBL5 Document Verification AI"
    APP_VERSION: str = "2.0.0"
    
    # 2. Database (Lấy từ .env)
    DATABASE_URL: str = "" # Pydantic sẽ tự nạp từ file .env vào đây

    # 3. Security (Cho phần User/Admin sau này)
    SECRET_KEY: str = "your-super-secret-key-pbl5" # Nên để trong .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 4. CORS (Để Frontend gọi API không bị lỗi)
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env" # Chỉ định file chứa biến môi trường

def get_settings():
    return Settings()