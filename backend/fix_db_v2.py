import asyncio
import os
from dotenv import load_dotenv

# Load .env từ thư mục gốc trước khi import app
root_dir = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(root_dir, '.env'))

from sqlalchemy import text
from app.db.database import engine

async def update_db():
    print("🚀 Bắt đầu cập nhật Database (Thêm public_token)...")
    async with engine.begin() as conn:
        try:
            # Kiểm tra xem cột public_token đã tồn tại trong documents chưa
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='documents' AND column_name='public_token'"))
            if not result.scalar():
                await conn.execute(text("ALTER TABLE documents ADD COLUMN public_token VARCHAR(64) UNIQUE;"))
                print("✅ Đã thêm cột public_token vào bảng documents.")
            else:
                print("ℹ️ Cột public_token đã tồn tại trong documents, không cần thêm.")
                
            # Kiểm tra bảng users
            result_phone = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number'"))
            if not result_phone.scalar():
                await conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);"))
                print("✅ Đã thêm cột phone_number vào bảng users.")
                
            result_avatar = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url'"))
            if not result_avatar.scalar():
                await conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);"))
                print("✅ Đã thêm cột avatar_url vào bảng users.")
                
        except Exception as e:
            print(f"❌ Lỗi: {e}")
            
    print("🎉 Hoàn tất!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_db())
