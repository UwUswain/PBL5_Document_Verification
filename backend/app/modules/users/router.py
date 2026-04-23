from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from app.db.database import get_db
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from app.core.security import hash_password, get_current_user, role_required

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

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Lấy thông tin user hiện tại
    """
    return current_user

# ================= ADMIN ONLY =================

@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(role_required(["admin"]))
):
    """
    [Admin] Liệt kê toàn bộ người dùng
    """
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(role_required(["admin"]))
):
    """
    [Admin] Cập nhật thông tin/quyền hạn/trạng thái User
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user này")
    
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(role_required(["admin"]))
):
    """
    [Admin] Xóa vĩnh viễn user (hoặc xóa mềm tùy cấu hình)
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user này")
    
    await db.delete(user)
    await db.commit()
    return None