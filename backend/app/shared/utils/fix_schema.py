import asyncio
from sqlalchemy import text
from app.db.database import engine

async def update_schema():
    async with engine.begin() as conn:
        print("🔍 Đang kiểm tra và cập nhật Schema...")
        try:
            # 1. Thêm cột verification_status nếu chưa tồn tại
            await conn.execute(text("""
                ALTER TABLE documents 
                ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING';
            """))
            
            # 2. Cập nhật các bản ghi cũ từ status sang verification_status (nếu cần)
            # Dựa trên logic: nếu status cũ là verified/suspicious thì chuyển sang verification_status
            await conn.execute(text("""
                UPDATE documents 
                SET verification_status = 'VERIFIED' 
                WHERE status = 'verified' AND (verification_status IS NULL OR verification_status = 'PENDING');
            """))
            await conn.execute(text("""
                UPDATE documents 
                SET verification_status = 'SUSPICIOUS' 
                WHERE status = 'suspicious' AND (verification_status IS NULL OR verification_status = 'PENDING');
            """))
            
            # 3. Chuẩn hóa status hệ thống về RECEIVED/COMPLETED
            await conn.execute(text("""
                UPDATE documents 
                SET status = 'COMPLETED' 
                WHERE status IN ('verified', 'suspicious', 'completed');
            """))
            
            print("✅ Cập nhật Schema thành công! Dữ liệu của bạn đã được bảo toàn.")
        except Exception as e:
            print(f"❌ Lỗi khi cập nhật Schema: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
