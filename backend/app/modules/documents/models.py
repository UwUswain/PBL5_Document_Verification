from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import Base, TimestampMixin

class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # Đường dẫn trong folder uploads
    sha256_hash = Column(String, unique=True, nullable=False) # Mã băm định danh file
    
    # Kết quả AI: Lưu tọa độ con dấu, chữ ký dưới dạng JSON
    ai_results = Column(JSON, nullable=True) 
    status = Column(String, default="pending") # pending, verified, invalid