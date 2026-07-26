from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.database import get_db
from app.modules.users.models import User
from app.core.security import get_current_user
from .schemas import AuditLogPageOut
from .service import AuditService

router = APIRouter()

@router.get("", response_model=AuditLogPageOut)
async def get_audit_logs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_email: Optional[str] = None,
    action: Optional[str] = None,
    date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total, items = await AuditService.get_logs(
        db, limit, offset, user_email, action, date
    )
    return {"items": items, "meta": {"limit": limit, "offset": offset, "total": total}}
