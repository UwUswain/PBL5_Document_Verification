import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# 1. TRỪU TƯỢNG (Abstraction): Lớp nền tảng cho SQLAlchemy 2.0
class Base(DeclarativeBase):
    """Mọi bảng dữ liệu đều phải kế thừa từ Base này [cite: 11, 38]"""
    pass

# 2. KẾ THỪA (Inheritance) qua Mixins
class UUIDMixin:
    """Đóng gói logic tạo ID dạng UUID duy nhất [cite: 41-42]"""
    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

class TimestampMixin:
    """Tự động ghi nhận thời gian tạo/cập nhật bản ghi [cite: 43-45]"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )

class SoftDeleteMixin:
    """Đa hình (Polymorphism): Hành vi ẩn bản ghi thay vì xóa thật [cite: 46-47]"""
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), 
        nullable=True, 
        index=True
    )

    @property
    def is_deleted(self) -> bool:
        """Kiểm tra xem bản ghi đã bị xóa mềm chưa [cite: 48-50]"""
        return self.deleted_at is not None