import sys
import os
from pathlib import Path

# 1. Định vị folder 'backend' để Python tìm thấy folder 'app'
backend_path = str(Path(__file__).resolve().parent.parent.parent)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path) 

import asyncio
from app.db.database import AsyncSessionLocal, engine
from app.modules.users.models import User, UserRole
from app.core.security import hash_password
from sqlalchemy import select

async def seed_data():
    print("Đang bắt đầu quá trình Seed dữ liệu Admin...")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Kiểm tra xem đã có Admin nào chưa
            result = await db.execute(
                select(User).where(User.email == "admin@pbl5.com")
            )
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                # 2. Tạo Admin mới hoàn toàn
                new_admin = User(
                    email="admin@pbl5.com",
                    password_hash=hash_password("123456"), 
                    role=UserRole.ADMIN
                )
                db.add(new_admin)
                print("✅ Đã tạo tài khoản Admin mới: admin@pbl5.com / 123456")
            else:
                # 3. FIX LỖI: Cập nhật lại mật khẩu băm chuẩn cho Admin đã tồn tại
                admin_user.password_hash = hash_password("123456")
                print("🔄 Đã cập nhật lại mật khẩu băm chuẩn cho Admin hiện có!")
            
            # Lưu thay đổi vào Database
            await db.commit()
            print("Ready to Roll !")
                
        except Exception as e:
            print(f"❌ Lỗi errrrrr: {str(e)}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(seed_data())