from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth.service import authenticate_user

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    token = await authenticate_user(login_data, db)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user_email": login_data.email
    }