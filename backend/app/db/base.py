from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
from datetime import datetime
from typing import Optional

# 1. Lớp nền tảng cho SQLAlchemy 2.0
class Base(DeclarativeBase):
    """Mọi bảng dữ liệu đều phải kế thừa từ Base này """
    pass

# 2. Mixin cho ID dạng UUID
class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

# 3. Mixin cho Thời gian
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )

# 4. Mixin cho Xóa mềm (Soft Delete)
class SoftDeleteMixin:
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True, 
        index=True
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None