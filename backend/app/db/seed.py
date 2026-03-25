from backend.app.db.session import SessionLocal
from backend.app.models.user import User, UserRole

def seed_admin():
    # Mở một phiên làm việc với DB
    db = SessionLocal()
    try:
        # 1. Khởi tạo đối tượng User (Đóng gói dữ liệu)
        new_admin = User(
            email="admin@pbl5.com",
            password_hash="hashed_password_123", # Tạm thời để text, sau này sẽ hash thật
            role=UserRole.ADMIN
        )
        
        # 2. Thêm vào DB
        db.add(new_admin)
        db.commit() # Xác nhận lưu
        db.refresh(new_admin)
        
        print(f"✅ Đã tạo Admin thành công!")
        print(f"🆔 ID tự sinh (UUID): {new_admin.id}")
        print(f"🕒 Ngày tạo: {new_admin.created_at}")
        
    except Exception as e:
        print(f"❌ Lỗi TO rồi: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()