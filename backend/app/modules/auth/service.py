from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.users.models import User
from app.core.security import verify_password

async def authenticate_user(email: str, password: str, db: AsyncSession):
    """
    Xác thực người dùng dựa trên Email và Password.
    Trả về đối tượng User nếu thành công, ngược lại trả về None.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        return None
        
    if not verify_password(password, user.password_hash):
        return None
        
    return user