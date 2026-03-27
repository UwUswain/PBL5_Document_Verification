from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from app.modules.users.models import UserRole # Import cái Enum Role bro đã viết

# 1. Dữ liệu khi đăng ký tài khoản mới
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# 2. Dữ liệu trả về cho Client (Ẩn mật khẩu đi - Tính Đóng gói)
class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True # SQLAlchemy 2.0 chuẩn

# 3. Dữ liệu khi đăng nhập
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 4. Token trả về sau khi đăng nhập thành công
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"