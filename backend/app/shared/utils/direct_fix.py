import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://postgres:123456@localhost:5432/pbl5_db"

async def fix_database_immediately():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        print("Checking and fixing Documents table structure...")
        try:
            # 1. Add verification_status column
            await conn.execute(text("""
                ALTER TABLE documents 
                ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING';
            """))
            
            # 2. Update data to match new FSM
            await conn.execute(text("""
                UPDATE documents 
                SET verification_status = 'VERIFIED' 
                WHERE status = 'verified';
            """))
            await conn.execute(text("""
                UPDATE documents 
                SET verification_status = 'SUSPICIOUS' 
                WHERE status = 'suspicious';
            """))
            await conn.execute(text("""
                UPDATE documents 
                SET status = 'COMPLETED' 
                WHERE status IN ('verified', 'suspicious', 'completed');
            """))
            
            print("SUCCESS: Database schema updated. Your data is safe.")
        except Exception as e:
            print(f"ERROR: {e}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_database_immediately())
