"""
Student service for authentication and student management.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Student, Exam, ExamRegistration, ExamSession, Exam
from app.schemas import StudentCreate, StudentUpdate, StudentLoginRequest, StudentLoginResponse, StudentResponse, ExamResponse, ExamSessionResponse
from app.core.config import settings


class StudentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_student_id(self, student_id: str) -> Optional[Student]:
        """Get student by their student_id (registration ID)."""
        result = await self.db.execute(
            select(Student).where(Student.student_id == student_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, student_uuid: UUID) -> Optional[Student]:
        """Get student by UUID."""
        result = await self.db.execute(
            select(Student).where(Student.id == student_uuid)
        )
        return result.scalar_one_or_none()

    async def create(self, student_data: StudentCreate) -> Student:
        """Create a new student."""
        student = Student(**student_data.model_dump())
        self.db.add(student)
        await self.db.flush()
        return student

    async def update(self, student_uuid: UUID, student_data: StudentUpdate) -> Optional[Student]:
        """Update student information."""
        student = await self.get_by_id(student_uuid)
        if not student:
            return None
        
        for field, value in student_data.model_dump(exclude_unset=True).items():
            setattr(student, field, value)
        
        await self.db.flush()
        return student

    async def login(self, request: StudentLoginRequest) -> StudentLoginResponse:
        """
        Authenticate student by student_id and create/resume exam session.
        """
        # 1. Find student by student_id
        student = await self.get_by_student_id(request.student_id)
        if not student:
            return StudentLoginResponse(
                success=False,
                message="Student ID not found. Please check your registered examination ID."
            )

        # 2. Find active exam registration for this student
        registration = await self._get_active_registration(student.id)
        if not registration:
            return StudentLoginResponse(
                success=False,
                message="No examination assigned. Your account is not registered for this examination."
            )

        # 3. Check if exam is available
        exam = await self._get_exam(registration.exam_id)
        if not exam:
            return StudentLoginResponse(
                success=False,
                message="Examination not found."
            )

        if exam.status != "ACTIVE":
            return StudentLoginResponse(
                success=False,
                message="Examination unavailable. This examination is no longer active."
            )

        # 4. Check for existing active session or create new one
        session = await self._get_or_create_session(student.id, registration)

        # 5. Build response
        return StudentLoginResponse(
            success=True,
            student=StudentResponse.model_validate(student),
            exam=ExamResponse.model_validate(exam),
            session=ExamSessionResponse.model_validate(session)
        )

    async def _get_active_registration(self, student_id: UUID) -> Optional["ExamRegistration"]:
        """Get the active exam registration for a student."""
        from app.models import ExamRegistration, Exam
        result = await self.db.execute(
            select(ExamRegistration)
            .join(Exam)
            .where(
                ExamRegistration.student_id == student_id,
                ExamRegistration.registration_status == "CONFIRMED",
                Exam.status == "ACTIVE"
            )
            .order_by(ExamRegistration.registered_at.desc())
        )
        return result.scalar_one_or_none()

    async def _get_exam(self, exam_id: UUID) -> Optional[Exam]:
        """Get exam by ID."""
        result = await self.db.execute(
            select(Exam).where(Exam.id == exam_id)
        )
        return result.scalar_one_or_none()

    async def _get_or_create_session(self, student_id: UUID, registration: "ExamRegistration") -> ExamSession:
        """Get existing active session or create a new one."""
        from app.models import ExamSession, SessionStatus
        from uuid import uuid4

        # Check for existing active session
        result = await self.db.execute(
            select(ExamSession).where(
                ExamSession.student_id == student_id,
                ExamSession.exam_id == registration.exam_id,
                ExamSession.status.in_([
                    SessionStatus.CREATED,
                    SessionStatus.READY,
                    SessionStatus.ACTIVE,
                    SessionStatus.PAUSED
                ])
            )
        )
        existing_session = result.scalar_one_or_none()

        if existing_session:
            # Update last activity
            existing_session.last_activity_at = datetime.utcnow()
            await self.db.flush()
            return existing_session

        # Create new session
        exam = await self._get_exam(registration.exam_id)
        session = ExamSession(
            session_id=f"S-{uuid4().hex[:8].upper()}",
            student_id=student_id,
            exam_id=registration.exam_id,
            registration_id=registration.id,
            status=SessionStatus.READY,
            duration_minutes=exam.duration_minutes if exam else 60,
            remaining_seconds=(exam.duration_minutes * 60) if exam else 3600,
            total_seconds=(exam.duration_minutes * 60) if exam else 3600,
            current_question=1,
        )
        self.db.add(session)
        await self.db.flush()

        # Log audit
        await self._log_audit(
            session_id=session.id,
            student_id=student_id,
            actor_type="STUDENT",
            actor_id=str(student_id),
            action="SESSION_CREATED",
            metadata={"registration_id": str(registration.id)}
        )

        return session

    async def _log_audit(
        self,
        session_id: UUID,
        student_id: UUID,
        actor_type: str,
        actor_id: str,
        action: str,
        metadata: Optional[dict] = None
    ) -> None:
        """Log an audit event."""
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

    async def list_students(self, skip: int = 0, limit: int = 100) -> List[Student]:
        """List all students."""
        result = await self.db.execute(
            select(Student).offset(skip).limit(limit).order_by(Student.created_at.desc())
        )
        return result.scalars().all()

    async def get_student_with_details(self, student_uuid: UUID) -> Optional[Student]:
        """Get student with related data."""
        result = await self.db.execute(
            select(Student)
            .where(Student.id == student_uuid)
        )
        return result.scalar_one_or_none()