"""
Answers API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas import ExamAnswerCreate, ExamAnswerUpdate, ExamAnswerResponse
from app.services.answer_service import AnswerService

router = APIRouter()


@router.post("", response_model=ExamAnswerResponse, status_code=status.HTTP_201_CREATED)
async def save_answer(
    answer_data: ExamAnswerCreate,
    db: AsyncSession = Depends(get_db),
):
    """Save or update an answer (upsert)."""
    answer_service = AnswerService(db)
    answer = await answer_service.save_answer(
        session_id=answer_data.session_id,
        student_id=answer_data.student_id,
        question_id=answer_data.question_id,
        answer_text=answer_data.answer_text or "",
        is_marked_for_review=answer_data.is_marked_for_review,
    )
    return ExamAnswerResponse.model_validate(answer)


@router.get("/session/{session_id}", response_model=list[ExamAnswerResponse])
async def get_session_answers(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all answers for a session."""
    answer_service = AnswerService(db)
    answers = await answer_service.get_by_session(session_id)
    return [ExamAnswerResponse.model_validate(a) for a in answers]


@router.get("/session/{session_id}/stats")
async def get_answer_stats(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get answer statistics for a session."""
    answer_service = AnswerService(db)
    return await answer_service.get_answer_stats(session_id)


@router.get("/session/{session_id}/question/{question_id}", response_model=ExamAnswerResponse)
async def get_answer(
    session_id: UUID,
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific answer."""
    answer_service = AnswerService(db)
    answer = await answer_service.get_by_session_and_question(session_id, question_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    return ExamAnswerResponse.model_validate(answer)


@router.patch("/{answer_id}", response_model=ExamAnswerResponse)
async def update_answer(
    answer_id: UUID,
    answer_data: ExamAnswerUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an answer."""
    answer_service = AnswerService(db)
    answer = await answer_service.update_answer(answer_id, answer_data.model_dump(exclude_unset=True))
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    return ExamAnswerResponse.model_validate(answer)


@router.post("/session/{session_id}/mark-review/{question_id}", response_model=ExamAnswerResponse)
async def mark_for_review(
    session_id: UUID,
    question_id: UUID,
    flagged: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Mark a question for review."""
    answer_service = AnswerService(db)
    answer = await answer_service.mark_for_review(session_id, question_id, flagged)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    return ExamAnswerResponse.model_validate(answer)


@router.post("/session/{session_id}/submit")
async def submit_all_answers(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Finalize all answers for submission."""
    answer_service = AnswerService(db)
    return await answer_service.submit_all_answers(session_id)