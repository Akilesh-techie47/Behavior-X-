"""
Exams API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas import ExamCreate, ExamUpdate, ExamResponse, ExamDetailResponse, QuestionCreate, QuestionResponse
from app.services.exam_service import ExamService

router = APIRouter()


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam_data: ExamCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new exam."""
    exam_service = ExamService(db)
    exam = await exam_service.create(exam_data)
    return ExamResponse.model_validate(exam)


@router.get("", response_model=list[ExamResponse])
async def list_exams(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all exams with optional filtering."""
    exam_service = ExamService(db)
    exams = await exam_service.list(skip=skip, limit=limit, status=status)
    return [ExamResponse.model_validate(e) for e in exams]


@router.get("/{exam_id}", response_model=ExamDetailResponse)
async def get_exam(
    exam_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get exam with all questions."""
    exam_service = ExamService(db)
    exam = await exam_service.get_exam_with_questions(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamDetailResponse.model_validate(exam)


@router.get("/code/{exam_code}", response_model=ExamResponse)
async def get_exam_by_code(
    exam_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get exam by exam code."""
    exam_service = ExamService(db)
    exam = await exam_service.get_by_code(exam_code)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamResponse.model_validate(exam)


@router.patch("/{exam_id}", response_model=ExamResponse)
async def update_exam(
    exam_id: UUID,
    exam_data: "ExamUpdate",
    db: AsyncSession = Depends(get_db),
):
    """Update an exam."""
    from app.schemas import ExamUpdate
    exam_service = ExamService(db)
    exam = await exam_service.update(exam_id, exam_data)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamResponse.model_validate(exam)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an exam."""
    exam_service = ExamService(db)
    success = await exam_service.delete(exam_id)
    if not success:
        raise HTTPException(status_code=404, detail="Exam not found")


# Question endpoints
@router.post("/{exam_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    exam_id: UUID,
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a question for an exam."""
    exam_service = ExamService(db)
    # Verify exam exists
    exam = await exam_service.get_by_id(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    question_data.exam_id = exam_id
    question = await exam_service.create_question(question_data)
    return QuestionResponse.model_validate(question)


@router.get("/{exam_id}/questions", response_model=list[QuestionResponse])
async def get_exam_questions(
    exam_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all questions for an exam."""
    exam_service = ExamService(db)
    questions = await exam_service.get_questions(exam_id)
    return [QuestionResponse.model_validate(q) for q in questions]