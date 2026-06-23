from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any

class DocumentOut(BaseModel):
    id: UUID
    file_name: str
    sha256_hash: str
    status: str
    category: Optional[str] = "Khác"
    summary: Optional[str] = ""
    ai_results: Optional[Dict[str, Any]] = {}
    file_path: Optional[str] = None
    qr_path: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PageMeta(BaseModel):
    limit: int
    offset: int
    total: int

class DocumentPageOut(BaseModel):
    items: List[DocumentOut]
    meta: PageMeta

class PrivacyRequest(BaseModel):
    level: str  # 'PRIVATE', 'SHARED', 'PUBLIC'
    shared_with: List[str] = []