"""
Evidence API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas import EvidenceCreate, EvidenceResponse
from app.services.evidence_service import EvidenceService

router = APIRouter()


@router.post("", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def create_evidence(
    evidence_data: EvidenceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create new evidence."""
    evidence_service = EvidenceService(db)
    evidence = await evidence_service.create(evidence_data)
    return EvidenceResponse.model_validate(evidence)


@router.get("/session/{session_id}", response_model=list[EvidenceResponse])
async def get_session_evidence(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all evidence for a session."""
    evidence_service = EvidenceService(db)
    evidence = await evidence_service.get_by_session(session_id)
    return [EvidenceResponse.model_validate(e) for e in evidence]


@router.get("/observation/{observation_id}", response_model=list[EvidenceResponse])
async def get_evidence_by_observation(
    observation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get evidence linked to an observation."""
    evidence_service = EvidenceService(db)
    evidence = await evidence_service.get_by_observation(observation_id)
    return [EvidenceResponse.model_validate(e) for e in evidence]


@router.post("/from-observation/{observation_id}", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def create_evidence_from_observation(
    observation_id: UUID,
    evidence_type: str,
    confidence: float,
    description: str,
    source: str,
    db: AsyncSession = Depends(get_db),
):
    """Create evidence from an observation."""
    evidence_service = EvidenceService(db)
    try:
        evidence = await evidence_service.create_from_observation(
            observation_id, evidence_type, confidence, description, source
        )
        return EvidenceResponse.model_validate(evidence)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/session/{session_id}/summary")
async def get_evidence_summary(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get evidence summary for a session."""
    evidence_service = EvidenceService(db)
    return await evidence_service.get_session_summary(session_id)