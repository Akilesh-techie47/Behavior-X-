"""
Exam service for exam management.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Exam, Question, ExamRegistration
from app.schemas import ExamCreate, ExamUpdate, ExamResponse, QuestionCreate, QuestionResponse


class ExamService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, exam_data: ExamCreate) -> Exam:
        """Create a new exam."""
        exam = Exam(**exam_data.model_dump())
        self.db.add(exam)
        await self.db.flush()
        return exam

    async def get_by_id(self, exam_id: UUID) -> Optional[Exam]:
        """Get exam by ID."""
        result = await self.db.execute(
            select(Exam).where(Exam.id == exam_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, exam_code: str) -> Optional[Exam]:
        """Get exam by exam_code."""
        result = await self.db.execute(
            select(Exam).where(Exam.exam_code == exam_code)
        )
        return result.scalar_one_or_none()

    async def list(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Exam]:
        """List exams with optional filtering."""
        query = select(Exam).order_by(Exam.created_at.desc())
        
        if status:
            query = query.where(Exam.status == status)
        
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().all()

    async def update(self, exam_id: UUID, exam_data: ExamUpdate) -> Optional[Exam]:
        """Update exam."""
        exam = await self.get_by_id(exam_id)
        if not exam:
            return None
        
        for field, value in exam_data.model_dump(exclude_unset=True).items():
            setattr(exam, field, value)
        
        exam.updated_at = datetime.utcnow()
        await self.db.flush()
        return exam

    async def delete(self, exam_id: UUID) -> bool:
        """Delete exam."""
        exam = await self.get_by_id(exam_id)
        if not exam:
            return False
        
        await self.db.delete(exam)
        await self.db.flush()
        return True

    async def get_questions(self, exam_id: UUID) -> List[Question]:
        """Get all questions for an exam."""
        result = await self.db.execute(
            select(Question)
            .where(Question.exam_id == exam_id)
            .order_by(Question.question_number)
        )
        return result.scalars().all()

    async def create_question(self, question_data: QuestionCreate) -> Question:
        """Create a question for an exam."""
        question = Question(**question_data.model_dump())
        self.db.add(question)
        await self.db.flush()
        return question

    async def get_question_by_number(self, exam_id: UUID, number: int) -> Optional[Question]:
        """Get question by exam and question number."""
        result = await self.db.execute(
            select(Question).where(
                Question.exam_id == exam_id,
                Question.question_number == number
            )
        )
        return result.scalar_one_or_none()

    async def get_exam_with_questions(self, exam_id: UUID) -> Optional[Exam]:
        """Get exam with all questions loaded."""
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(Exam)
            .options(selectinload(Exam.questions))
            .where(Exam.id == exam_id)
        )
        return result.scalar_one_or_none()

    async def get_student_registrations(self, student_id: UUID) -> List[ExamRegistration]:
        """Get all exam registrations for a student."""
        result = await self.db.execute(
            select(ExamRegistration).where(ExamRegistration.student_id == student_id)
        )
        return result.scalars().all()

    async def register_student(self, student_id: UUID, exam_id: UUID, seat_number: Optional[str] = None) -> ExamRegistration:
        """Register a student for an exam."""
        registration = ExamRegistration(
            student_id=student_id,
            exam_id=exam_id,
            seat_number=seat_number,
            registration_status="CONFIRMED",
        )
        self.db.add(registration)
        await self.db.flush()
        return registration