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
                # 2. Tạo Admin mẫu (Bảo mật tuyệt đối bằng băm mật khẩu)
                new_admin = User(
                    email="admin@pbl5.com",
                    password_hash=hash_password("123456"), # Mật khẩu test
                    role=UserRole.ADMIN
                )
                db.add(new_admin)
                await db.commit()
                print("✅ Đã tạo tài khoản Admin thành công: admin@pbl5.com / 123456")
            else:
                print("ℹ️ Tài khoản Admin đã tồn tại rồi , không cần tạo thêm đâu.")
                
        except Exception as e:
            print(f"❌ Lỗi to rồi long ơi: {str(e)}")
            await db.rollback()

if __name__ == "__main__":
    # Chạy hàm seed bằng asyncio
    asyncio.run(seed_data())