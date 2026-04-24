import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.db.database import get_db
from app.modules.users.models import User # Đảm bảo import đúng model User

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# 1. Hàm băm mật khẩu
def hash_password(password: str) -> str:
    # Bcrypt yêu cầu đầu vào là bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

# 2. Hàm kiểm tra mật khẩu
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Chuyển cả hai về bytes để so sánh
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        print(f"❌ Verify Password Error: {e}")
        return False

# 3. Hàm tạo Token (Thêm Role vào payload)
def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Nén cả 'sub' (email) và 'role' (quyền) vào payload của JWT
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "role": role  # <--- Quan trọng để phân quyền nhanh
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# 4. Hàm Lấy User hiện tại từ Token
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực danh tính ơi!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("⚠️ Token payload missing 'sub' field")
            raise credentials_exception
        print(f"✅ Token decoded for user: {email}")
    except JWTError as e:
        print(f"❌ JWT Decode Error: {e}")
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

# 5. Ham Màng lọc phân quyền(Role Checker)
def role_required(allowed_roles: list):
    async def role_checker(current_user: User = Depends(get_current_user)):
        # Kiểm tra xem role của user có nằm trong danh sách cho phép không
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền thực hiện hành động này!"
            )
        return current_user
    return role_checker