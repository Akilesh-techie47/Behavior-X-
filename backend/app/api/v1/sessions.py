"""
Sessions API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas import ExamSessionCreate, ExamSessionUpdate, ExamSessionResponse, ExamSessionDetailResponse
from app.services.session_service import SessionService

router = APIRouter()


@router.post("", response_model=ExamSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: ExamSessionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new exam session."""
    session_service = SessionService(db)
    session = await session_service.create(session_data)
    return ExamSessionResponse.model_validate(session)


@router.get("", response_model=list[ExamSessionResponse])
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    exam_id: Optional[UUID] = Query(None),
    student_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List exam sessions with filtering."""
    session_service = SessionService(db)
    sessions = await session_service.list_sessions(
        skip=skip, limit=limit, status=status, exam_id=exam_id, student_id=student_id
    )
    return [ExamSessionResponse.model_validate(s) for s in sessions]


@router.get("/{session_id}", response_model=ExamSessionDetailResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get session with all related data."""
    session_service = SessionService(db)
    session = await session_service.get_session_with_details(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ExamSessionDetailResponse.model_validate(session)


@router.get("/session-id/{session_id}", response_model=ExamSessionResponse)
async def get_session_by_string_id(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get session by string session_id (e.g., S-1025)."""
    session_service = SessionService(db)
    session = await session_service.get_by_session_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ExamSessionResponse.model_validate(session)


@router.patch("/{session_id}", response_model=ExamSessionResponse)
async def update_session(
    session_id: UUID,
    session_data: ExamSessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a session."""
    session_service = SessionService(db)
    session = await session_service.update(session_id, session_data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ExamSessionResponse.model_validate(session)


@router.post("/{session_id}/start", response_model=ExamSessionResponse)
async def start_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Start an exam session."""
    session_service = SessionService(db)
    session = await session_service.start_exam(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ExamSessionResponse.model_validate(session)


@router.post("/{session_id}/submit", response_model=ExamSessionResponse)
async def submit_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Submit an exam session."""
    session_service = SessionService(db)
    session = await session_service.submit_exam(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ExamSessionResponse.model_validate(session)


@router.post("/{session_id}/heartbeat", response_model=ExamSessionResponse)
async def session_heartbeat(
    session_id: UUID,
    remaining_seconds: int = Query(..., ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Update session heartbeat with remaining time."""
    session_service = SessionService(db)
    session = await session_service.heartbeat(session_id, remaining_seconds)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return ExamSessionResponse.model_validate(session)


@router.get("/examiner/dashboard")
async def examiner_dashboard(
    db: AsyncSession = Depends(get_db),
):
    """Get examiner dashboard data."""
    session_service = SessionService(db)
    return await session_service.get_examiner_dashboard_data()