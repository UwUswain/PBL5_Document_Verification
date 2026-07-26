import uuid
import secrets
from typing import Optional
from sqlalchemy import String, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

class Document(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "documents"

    # # 1. Chủ sở hữu (Nối với bảng users)
    # owner_id: Mapped[uuid.UUID] = mapped_column(
    #     PGUUID(as_uuid=True), 
    #     ForeignKey("users.id"), 
    #     nullable=False
    # )
    # Đảm bảo đã có import Optional ở đầu file: from typing import Optional

# 1. Chủ sở hữu (Sửa lại để cho phép NULL khi test)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
    PGUUID(as_uuid=True),
    ForeignKey("users.id"),
    nullable=True  # CHỖ NÀY: Sửa False thành True
    )

    # 2. Thông tin file vật lý
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # 3. Bảo mật & Xác thực
    sha256_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    qr_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    public_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, default=lambda: secrets.token_hex(16))

    
    # 4. TRỤ CỘT AI (Mới thêm cho Demo tuần tới)
    # Lưu Text thô sau khi chạy OCR (EasyOCR/PaddleOCR) -> Phục vụ tính năng TÌM KIẾM
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Lưu kết quả PHÂN LOẠI (Hợp đồng, Quyết định, Công văn...) -> Phục vụ PHÂN LOẠI
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Lưu nội dung rút gọn từ AI (Gemini/GPT) -> Phục vụ TÓM TẮT
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 5. Kết quả Thị giác máy tính (YOLOv8)
    # Lưu tọa độ JSON của con dấu, chữ ký để vẽ khung (Bounding Box) trên Web
    ai_results: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # 6. Trạng thái xử lý hệ thống
    status: Mapped[str] = mapped_column(String(20), default="RECEIVED") 
    verification_status: Mapped[str] = mapped_column(String(20), default="PENDING")
    
    # 7. Trạng thái hiển thị (Cộng đồng)
    is_public: Mapped[bool] = mapped_column(default=False)
    # Các trạng thái: pending, ocr_processing, ai_summarizing, completed, error