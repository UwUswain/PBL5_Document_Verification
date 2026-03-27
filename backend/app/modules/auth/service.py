from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.modules.users.models import User
from app.core.security import verify_password, create_access_token
from app.modules.auth.schemas import LoginRequest

async def authenticate_user(login_data: LoginRequest, db: AsyncSession):
    # 1. Tìm user theo email
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    # 2. Kiểm tra user tồn tại và mật khẩu khớp không
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng rồi bro ơi!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Tạo JWT Token
    access_token = create_access_token(subject=user.email)
    return access_token