import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:123456@localhost:5432/pbl5_db"

async def upgrade_db():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Add full_name
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
            print("Added column full_name")
        except Exception as e:
            print(f"Column full_name might already exist")

        # Add is_active
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
            print("Added column is_active")
        except Exception as e:
            print(f"Column is_active might already exist")
            
    print("Upgrade completed!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(upgrade_db())
