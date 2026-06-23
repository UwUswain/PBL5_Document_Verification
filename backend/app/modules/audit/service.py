from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from .models import AuditLog
from datetime import datetime

class AuditService:
    @staticmethod
    async def log_action(db: AsyncSession, user_email: str, action: str, document_id: str = None, document_name: str = None):
        try:
            log = AuditLog(
                user_email=user_email,
                action=action,
                document_id=document_id,
                document_name=document_name
            )
            db.add(log)
            # We don't commit here. The caller should commit. Or we can commit.
            # But the caller usually commits their own transaction. We'll let caller commit.
            # Actually, to make it safe, we can just add to session.
        except Exception as e:
            print(f"Error logging action: {e}")

    @staticmethod
    async def get_logs(db: AsyncSession, limit: int = 50, offset: int = 0, user_email: str = None, action: str = None, date: str = None):
        conditions = []
        if user_email:
            conditions.append(AuditLog.user_email.ilike(f"%{user_email}%"))
        if action:
            conditions.append(AuditLog.action == action)
        if date:
            try:
                parsed_date = datetime.strptime(date, '%Y-%m-%d').date()
                conditions.append(cast(AuditLog.created_at, Date) == parsed_date)
            except ValueError:
                pass
                
        stmt_count = select(func.count()).select_from(AuditLog).where(*conditions)
        total = await db.scalar(stmt_count)
        
        stmt = select(AuditLog).where(*conditions).order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(stmt)
        return (total or 0), result.scalars().all()
