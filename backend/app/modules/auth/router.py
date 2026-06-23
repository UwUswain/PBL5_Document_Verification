from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.modules.auth.service import authenticate_user
from app.core.security import create_access_token, hash_password
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserCreate, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng rồi bro!")

    new_user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=UserRole.USER # Mặc định role user
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(form_data.username, form_data.password, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng bro ơi!",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=user.email, 
        role=user.role.value 
    )
    
    from app.modules.audit.service import AuditService
    await AuditService.log_action(db, user.email, "LOGIN")
    await db.commit()
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value}