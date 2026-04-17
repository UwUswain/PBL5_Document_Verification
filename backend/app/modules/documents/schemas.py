from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class DocumentOut(BaseModel):
    id: UUID
    file_name: str
    sha256_hash: str
    status: str
    created_at: datetime
    # THÊM CÁC DÒNG NÀY VÀO:
    category: Optional[str] = "Khác"
    summary: Optional[str] = ""
    ai_results: Optional[dict] = {} 
    file_path: Optional[str] = None
    qr_path: Optional[str] = None
  # -----------------------------

    class Config:
        from_attributes = True


class PageMeta(BaseModel):
    limit: int
    offset: int
    total: int


class DocumentPageOut(BaseModel):
    items: List[DocumentOut]
    meta: PageMeta