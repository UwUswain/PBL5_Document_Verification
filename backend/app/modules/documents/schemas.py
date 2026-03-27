from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class DocumentOut(BaseModel):
    id: UUID
    file_name: str
    sha256_hash: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True