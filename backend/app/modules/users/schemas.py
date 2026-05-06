from pydantic import BaseModel, EmailStr
from typing import Optional
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
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # SQLAlchemy 2.0 chuẩn

# 2.1 Dữ liệu cập nhật User (Admin dùng)
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

# 3. Dữ liệu khi đăng nhập
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 4. Token trả về sau khi đăng nhập thành công
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"