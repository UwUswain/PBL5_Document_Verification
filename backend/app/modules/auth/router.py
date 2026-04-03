from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # Thêm dòng này
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.modules.auth.service import authenticate_user
from app.core.security import create_access_token

router = APIRouter()

@router.post("/login")
async def login(
    # Thay LoginRequest bằng OAuth2PasswordRequestForm
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # Chú ý: OAuth2PasswordRequestForm dùng trường .username thay vì .email
    user = await authenticate_user(form_data.username, form_data.password, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng bro ơi!",
            headers={"WWW-Authenticate": "Bearer"},
        )

# 1. Gọi hàm tạo token với đầy đủ 2 tham số: subject và role
    # Lưu ý: user.role là Enum nên dùng .value để lấy chuỗi "admin" hoặc "user"
    access_token = create_access_token(
        subject=user.email, 
        role=user.role.value 
    )
    
    # 2. Trả về token cho Frontend/Swagger
    return {"access_token": access_token, "token_type": "bearer"}