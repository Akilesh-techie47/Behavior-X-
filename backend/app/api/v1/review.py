"""
Review API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas import ReviewDecisionCreate, ReviewDecisionResponse
from app.services.review_service import ReviewService
from app.models import DecisionKind

router = APIRouter()


@router.post("", response_model=ReviewDecisionResponse, status_code=status.HTTP_201_CREATED)
async def create_decision(
    decision_data: ReviewDecisionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new review decision."""
    review_service = ReviewService(db)
    decision = await review_service.create(decision_data)
    return ReviewDecisionResponse.model_validate(decision)


@router.get("/session/{session_id}", response_model=list[ReviewDecisionResponse])
async def get_session_decisions(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all review decisions for a session."""
    review_service = ReviewService(db)
    decisions = await review_service.get_session_decisions(session_id)
    return [ReviewDecisionResponse.model_validate(d) for d in decisions]


@router.post("/session/{session_id}/decide", response_model=ReviewDecisionResponse, status_code=status.HTTP_201_CREATED)
async def create_decision_for_session(
    session_id: UUID,
    reviewer_id: str,
    decision: DecisionKind,
    note: Optional[str] = None,
    evidence_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a review decision for a session."""
    review_service = ReviewService(db)
    evidence_uuid = UUID(evidence_id) if evidence_id else None
    decision = await review_service.create_decision(
        session_id=session_id,
        reviewer_id=reviewer_id,
        decision=decision,
        note=note,
        evidence_id=evidence_uuid,
    )
    return ReviewDecisionResponse.model_validate(decision)


@router.get("/session/{session_id}/summary")
async def get_review_summary(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get review summary for a session."""
    review_service = ReviewService(db)
    return await review_service.get_session_summary(session_id)