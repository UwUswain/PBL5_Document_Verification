from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserResponse
from app.core.security import hash_password

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Kiểm tra xem email đã tồn tại chưa
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng rồi bro!")

    # 2. Tạo User mới và băm mật khẩu
    new_user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password) # Gọi từ core/security.py
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user