from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    file_name: str
    file_path: str
    status: str # 'pending', 'verified', 'invalid'
    created_at: datetime

    class Config:
        from_attributes = True