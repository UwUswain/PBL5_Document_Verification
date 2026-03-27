from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import get_settings

settings = get_settings()

# 1. Tạo Engine bất đồng bộ
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True, # Hiện log SQL để bro dễ soi lỗi đêm khuya
    future=True
)

# 2. Tạo Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# 3. Dependency để các API gọi DB (Dependency Injection)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()