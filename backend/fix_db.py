import asyncio
from sqlalchemy import text
from app.db.database import engine

async def upgrade_db():
    print(" đang nâng cấp Database...")
    async with engine.begin() as conn:
        # Thêm cột full_name
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
            print(" Đã thêm cột full_name")
        except Exception as e:
            print(f" Cột full_name có thể đã tồn tại: {e}")

        # Thêm cột is_active
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
            print(" Đã thêm cột is_active")
        except Exception as e:
            print(f" Cột is_active có thể đã tồn tại: {e}")
            
    print(" Nâng cấp hoàn tất! Giờ ông có thể đăng nhập bình thường.")

if __name__ == "__main__":
    asyncio.run(upgrade_db())
