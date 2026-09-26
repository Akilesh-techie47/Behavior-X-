"""
Answer service for managing student answers.
"""
from datetime import datetime
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ExamAnswer, ExamSession, SessionStatus
from app.schemas import ExamAnswerCreate, ExamAnswerUpdate, ExamAnswerResponse


class AnswerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_session_and_question(
        self, session_id: UUID, question_id: UUID
    ) -> Optional[ExamAnswer]:
        """Get answer for a specific session and question."""
        result = await self.db.execute(
            select(ExamAnswer).where(
                ExamAnswer.session_id == session_id,
                ExamAnswer.question_id == question_id
            )
        )
        return result.scalar_one_or_none()

    async def get_by_session(self, session_id: UUID) -> List[ExamAnswer]:
        """Get all answers for a session."""
        result = await self.db.execute(
            select(ExamAnswer)
            .where(ExamAnswer.session_id == session_id)
            .order_by(ExamAnswer.answered_at)
        )
        return result.scalars().all()

    async def save_answer(
        self,
        session_id: UUID,
        student_id: UUID,
        question_id: UUID,
        answer_text: str,
        is_marked_for_review: bool = False
    ) -> ExamAnswer:
        """Save or update an answer (upsert)."""
        existing = await self.get_by_session_and_question(session_id, question_id)
        
        if existing:
            existing.answer_text = answer_text
            existing.is_marked_for_review = is_marked_for_review
            existing.updated_at = datetime.utcnow()
            if not existing.answered_at:
                existing.answered_at = datetime.utcnow()
            await self.db.flush()
            return existing
        else:
            answer = ExamAnswer(
                session_id=session_id,
                student_id=student_id,
                question_id=question_id,
                answer_text=answer_text,
                is_marked_for_review=is_marked_for_review,
                answered_at=datetime.utcnow(),
            )
            self.db.add(answer)
            await self.db.flush()
            return answer

    async def update_answer(
        self, answer_id: UUID, answer_data: dict
    ) -> Optional["ExamAnswer"]:
        """Update an answer."""
        from app.models import ExamAnswer
        result = await self.db.execute(
            select(ExamAnswer).where(ExamAnswer.id == answer_id)
        )
        answer = result.scalar_one_or_none()
        
        if not answer:
            return None
        
        for field, value in answer_data.items():
            if hasattr(answer, field):
                setattr(answer, field, value)
        
        answer.updated_at = datetime.utcnow()
        await self.db.flush()
        return answer

    async def get_session_answers(self, session_id: UUID) -> List[dict]:
        """Get all answers for a session formatted for submission."""
        answers = await self.get_by_session(session_id)
        return [
            {
                "question_id": str(a.question_id),
                "answer_text": a.answer_text,
                "is_marked_for_review": a.is_marked_for_review,
                "answered_at": a.answered_at.isoformat() if a.answered_at else None,
            }
            for a in answers
        ]

    async def get_answer_stats(self, session_id: UUID) -> dict:
        """Get answer statistics for a session."""
        from app.models import ExamAnswer
        answers = await self.get_by_session(session_id)
        
        answered = len([a for a in answers if a.answer_text and a.answer_text.strip()])
        flagged = len([a for a in answers if a.is_marked_for_review])
        
        return {
            "total_questions": len(answers),
            "answered": answered,
            "flagged": flagged,
            "unanswered": len(answers) - answered,
        }

    async def mark_for_review(self, session_id: UUID, question_id: UUID, flagged: bool = True) -> Optional["ExamAnswer"]:
        """Mark a question for review."""
        answer = await self.get_by_session_and_question(session_id, question_id)
        if not answer:
            return None
        
        answer.is_marked_for_review = flagged
        answer.updated_at = datetime.utcnow()
        await self.db.flush()
        return answer

    async def submit_all_answers(self, session_id: UUID) -> Dict:
        """Finalize all answers for submission."""
        from app.models import ExamAnswer
        answers = await self.get_by_session(session_id)
        
        # Ensure all answers have answered_at set
        for answer in answers:
            if answer.answer_text and answer.answer_text.strip() and not answer.answered_at:
                answer.answered_at = datetime.utcnow()
        
        await self.db.flush()
        
        return {
            "total": len(answers),
            "answered": len([a for a in answers if a.answer_text and a.answer_text.strip()]),
            "flagged": len([a for a in answers if a.is_marked_for_review]),
        }