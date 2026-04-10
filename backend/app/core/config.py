from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # 1. Thông tin chung
    APP_NAME: str = "PBL5 Document Verification AI"
    APP_VERSION: str = "2.0.0"
    
    # 2. Database (Tự nạp từ .env)
    DATABASE_URL: str = "" 

    # 3. Security
    SECRET_KEY: str = "your-super-secret-key-pbl5"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 4. CORS
    CORS_ORIGINS: List[str] = ["*"]

    # 5. AI Service (Gemini & Paddle)
    GEMINI_API_KEY: str
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: str = "True"

    # CẤU HÌNH QUAN TRỌNG: Chỉ cần dòng này, không cần class Config nữa
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="allow"  # Cho phép các biến lạ trong .env không bị báo lỗi
    )

def get_settings():
    return Settings()