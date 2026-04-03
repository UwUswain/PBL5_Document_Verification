import enum
from sqlalchemy import String, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

#định nghĩa role
class UserRole(enum.Enum):
    ADMIN = "admin"
    USER = "user"

class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Bảng User kế thừa tất cả từ các Mixins:
    - Có sẵn ID dạng UUID
    - Có sẵn ngày tạo/cập nhật
    - Có sẵn tính năng xóa mềm
    """
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER, nullable=False)