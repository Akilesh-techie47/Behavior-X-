"""
Session service for exam session management.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ExamSession, SessionStatus, Exam, Student, ExamRegistration
from app.schemas import ExamSessionCreate, ExamSessionUpdate, ExamSessionResponse, ExamSessionDetailResponse
from app.core.config import settings


class SessionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, session_id: UUID) -> Optional[ExamSession]:
        """Get session by UUID."""
        result = await self.db.execute(
            select(ExamSession).where(ExamSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_by_session_id(self, session_id: str) -> Optional[ExamSession]:
        """Get session by session_id string."""
        result = await self.db.execute(
            select(ExamSession).where(ExamSession.session_id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_student_active_session(self, student_id: UUID, exam_id: UUID) -> Optional[ExamSession]:
        """Get active session for student+exam combination."""
        result = await self.db.execute(
            select(ExamSession).where(
                ExamSession.student_id == student_id,
                ExamSession.exam_id == exam_id,
                ExamSession.status.in_([
                    SessionStatus.CREATED,
                    SessionStatus.READY,
                    SessionStatus.ACTIVE,
                    SessionStatus.PAUSED
                ])
            )
        )
        return result.scalar_one_or_none()

    async def create(self, session_data: ExamSessionCreate) -> ExamSession:
        """Create a new exam session."""
        exam = await self._get_exam(session_data.exam_id)
        if not exam:
            raise ValueError("Exam not found")
        
        session = ExamSession(
            session_id=f"S-{UUID().hex[:8].upper()}",
            student_id=session_data.student_id,
            exam_id=session_data.exam_id,
            registration_id=session_data.registration_id,
            status=SessionStatus.READY,
            duration_minutes=session_data.duration_minutes or exam.duration_minutes,
            remaining_seconds=(session_data.duration_minutes or exam.duration_minutes) * 60,
            total_seconds=(session_data.duration_minutes or exam.duration_minutes) * 60,
            current_question=1,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def update(self, session_id: UUID, session_data: ExamSessionUpdate) -> Optional[ExamSession]:
        """Update session."""
        session = await self.get_by_id(session_id)
        if not session:
            return None
        
        for field, value in session_data.model_dump(exclude_unset=True).items():
            setattr(session, field, value)
        
        session.updated_at = datetime.utcnow()
        await self.db.flush()
        return session

    async def start_exam(self, session_id: UUID) -> Optional[ExamSession]:
        """Start an exam session."""
        session = await self.get_by_id(session_id)
        if not session:
            return None
        
        if session.status not in [SessionStatus.CREATED, SessionStatus.READY]:
            raise ValueError(f"Cannot start session in status: {session.status}")
        
        session.status = SessionStatus.ACTIVE
        session.started_at = datetime.utcnow()
        session.last_activity_at = datetime.utcnow()
        session.remaining_seconds = session.total_seconds
        session.updated_at = datetime.utcnow()
        
        await self._log_audit(
            session_id=session.id,
            student_id=session.student_id,
            actor_type="STUDENT",
            actor_id=str(session.student_id),
            action="EXAM_STARTED"
        )
        
        await self.db.flush()
        return session

    async def submit_exam(self, session_id: UUID) -> Optional[ExamSession]:
        """Submit an exam session."""
        session = await self.get_by_id(session_id)
        if not session:
            return None
        
        if session.status != SessionStatus.ACTIVE:
            raise ValueError(f"Cannot submit session in status: {session.status}")
        
        session.status = SessionStatus.SUBMITTED
        session.submitted_at = datetime.utcnow()
        session.remaining_seconds = 0
        session.updated_at = datetime.utcnow()
        
        await self._log_audit(
            session_id=session.id,
            student_id=session.student_id,
            actor_type="STUDENT",
            actor_id=str(session.student_id),
            action="EXAM_SUBMITTED"
        )
        
        await self.db.flush()
        return session

    async def heartbeat(self, session_id: UUID, remaining_seconds: int) -> Optional[ExamSession]:
        """Update session heartbeat with remaining time."""
        session = await self.get_by_id(session_id)
        if not session:
            return None
        
        session.remaining_seconds = max(0, remaining_seconds)
        session.last_activity_at = datetime.utcnow()
        session.updated_at = datetime.utcnow()
        
        # Auto-expire if time ran out
        if session.remaining_seconds <= 0 and session.status == SessionStatus.ACTIVE:
            session.status = SessionStatus.EXPIRED
            session.submitted_at = datetime.utcnow()
        
        await self.db.flush()
        return session

    async def get_session_with_details(self, session_id: UUID) -> Optional[ExamSession]:
        """Get session with all related data."""
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(ExamSession)
            .options(
                selectinload(ExamSession.answers),
                selectinload(ExamSession.device_connections),
                selectinload(ExamSession.observations),
                selectinload(ExamSession.evidence),
                selectinload(ExamSession.review_decisions),
                selectinload(ExamSession.audit_logs),
            )
            .where(ExamSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def list_sessions(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        exam_id: Optional[UUID] = None,
        student_id: Optional[UUID] = None
    ) -> List[ExamSession]:
        """List sessions with filtering."""
        query = select(ExamSession).order_by(ExamSession.created_at.desc())
        
        if status:
            query = query.where(ExamSession.status == status)
        if exam_id:
            query = query.where(ExamSession.exam_id == exam_id)
        if student_id:
            query = query.where(ExamSession.student_id == student_id)
        
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    async def _get_exam(self, exam_id: UUID) -> Optional[Exam]:
        result = await self.db.execute(select(Exam).where(Exam.id == exam_id))
        return result.scalar_one_or_none()

    async def _log_audit(
        self,
        session_id: UUID,
        student_id: UUID,
        actor_type: str,
        actor_id: str,
        action: str,
        metadata: Optional[dict] = None
    ) -> None:
        from app.models import AuditLog, ActorType
        import json

        audit = AuditLog(
            session_id=session_id,
            student_id=student_id,
            actor_type=ActorType(actor_type),
            actor_id=actor_id,
            action=action,
            metadata=json.dumps(metadata) if metadata else None,
        )
        self.db.add(audit)
        await self.db.flush()

    async def get_examiner_dashboard_data(self) -> dict:
        """Get data for examiner dashboard."""
        # Active sessions
        active_sessions = await self.db.execute(
            select(ExamSession).where(ExamSession.status == SessionStatus.ACTIVE)
        )
        active = active_sessions.scalars().all()

        # Queued sessions
        queued_sessions = await self.db.execute(
            select(ExamSession).where(ExamSession.status.in_([SessionStatus.CREATED, SessionStatus.READY]))
        )
        queued = queued_sessions.scalars().all()

        # Stats
        total_sessions = await self.db.execute(select(func.count(ExamSession.id)))
        live_count = len(active)
        queued_count = len(queued)
        completed = await self.db.execute(
            select(func.count(ExamSession.id)).where(ExamSession.status == SessionStatus.SUBMITTED)
        )

        return {
            "active_sessions": active,
            "queued_sessions": queued,
            "stats": {
                "total": total_sessions.scalar() or 0,
                "live": live_count,
                "queued": queued_count,
                "completed": completed.scalar() or 0,
            }
        }


# Need to import func for the dashboard query
from sqlalchemy import func