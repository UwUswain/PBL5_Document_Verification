from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class AuditLogOut(BaseModel):
    id: UUID
    user_email: Optional[str]
    action: str
    document_id: Optional[UUID]
    document_name: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PageMeta(BaseModel):
    limit: int
    offset: int
    total: int

class AuditLogPageOut(BaseModel):
    items: List[AuditLogOut]
    meta: PageMeta
