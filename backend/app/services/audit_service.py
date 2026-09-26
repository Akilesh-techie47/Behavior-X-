"""
Audit service for logging system events.
"""
from datetime import datetime
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog, ActorType, ExamSession
from app.schemas import AuditLogCreate, AuditLogResponse


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        action: str,
        actor_type: ActorType,
        actor_id: str,
        session_id: Optional[UUID] = None,
        student_id: Optional[UUID] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Log an audit event."""
        import json
        
        audit = AuditLog(
            session_id=session_id,
            student_id=student_id,
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            metadata=json.dumps(metadata) if metadata else None,
        )
        self.db.add(audit)
        await self.db.flush()
        return audit

    async def log_student_action(
        self,
        student_id: UUID,
        action: str,
        session_id: Optional[UUID] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Log a student action."""
        return await self.log(
            action=action,
            actor_type=ActorType.STUDENT,
            actor_id=str(student_id),
            session_id=session_id,
            student_id=student_id,
            metadata=metadata
        )

    async def log_examiner_action(
        self,
        examiner_id: str,
        action: str,
        session_id: Optional[UUID] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Log an examiner action."""
        return await self.log(
            action=action,
            actor_type=ActorType.EXAMINER,
            actor_id=examiner_id,
            session_id=session_id,
            metadata=metadata
        )

    async def log_system_action(
        self,
        action: str,
        session_id: Optional[UUID] = None,
        metadata: Optional[Dict] = None
    ) -> AuditLog:
        """Log a system action."""
        return await self.log(
            action=action,
            actor_type=ActorType.SYSTEM,
            actor_id="system",
            session_id=session_id,
            metadata=metadata
        )

    async def get_by_session(self, session_id: UUID) -> List[AuditLog]:
        """Get all audit logs for a session."""
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.session_id == session_id)
            .order_by(AuditLog.timestamp)
        )
        return result.scalars().all()

    async def get_by_student(self, student_id: UUID) -> List[AuditLog]:
        """Get all audit logs for a student."""
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.student_id == student_id)
            .order_by(AuditLog.timestamp.desc())
        )
        return result.scalars().all()

    async def get_recent(self, hours: int = 24, limit: int = 100) -> List[AuditLog]:
        """Get recent audit logs."""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.timestamp >= cutoff)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_stats(self) -> dict:
        """Get audit log statistics."""
        total = await self.db.execute(select(func.count(AuditLog.id)))
        by_action = await self.db.execute(
            select(AuditLog.action, func.count(AuditLog.id))
            .group_by(AuditLog.action)
        )
        by_actor = await self.db.execute(
            select(AuditLog.actor_type, func.count(AuditLog.id))
            .group_by(AuditLog.actor_type)
        )
        
        return {
            "total": total.scalar() or 0,
            "by_action": dict(by_action.all()),
            "by_actor": {k.value: v for k, v in by_actor.all()},
        }


from sqlalchemy import func