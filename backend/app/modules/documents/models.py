import uuid
from typing import Optional #
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin, TimestampMixin

class Document(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documents"

    # 1. Chủ sở hữu (Ai là người upload?)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), 
        ForeignKey("users.id"), 
        nullable=False
    )
    
    # 2. Thông tin file
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    
    # 3. Bảo mật
    sha256_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    qr_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # 4. Kết quả từ AI (Lưu tọa độ JSON)
    ai_results: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # 5. Trạng thái
    status: Mapped[str] = mapped_column(String, default="pending")