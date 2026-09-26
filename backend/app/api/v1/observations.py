"""
Observations API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas import ObservationCreate, ObservationResponse
from app.services.observation_service import ObservationService

router = APIRouter()


@router.post("", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
async def create_observation(
    observation_data: ObservationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new observation."""
    observation_service = ObservationService(db)
    observation = await observation_service.create(observation_data)
    return ObservationResponse.model_validate(observation)


@router.post("/batch", response_model=list[ObservationResponse], status_code=status.HTTP_201_CREATED)
async def create_observations_batch(
    observations: list[ObservationCreate],
    db: AsyncSession = Depends(get_db),
):
    """Create multiple observations."""
    observation_service = ObservationService(db)
    observations = await observation_service.create_batch(observations)
    return [ObservationResponse.model_validate(o) for o in observations]


@router.get("/session/{session_id}", response_model=list[ObservationResponse])
async def get_session_observations(
    session_id: UUID,
    limit: int = Query(1000, ge=1, le=10000),
    db: AsyncSession = Depends(get_db),
):
    """Get all observations for a session."""
    observation_service = ObservationService(db)
    observations = await observation_service.get_by_session(session_id, limit)
    return [ObservationResponse.model_validate(o) for o in observations]


@router.get("/session/{session_id}/type/{event_type}", response_model=list[ObservationResponse])
async def get_observations_by_type(
    session_id: UUID,
    event_type: str,
    db: AsyncSession = Depends(get_db),
):
    """Get observations by type."""
    observation_service = ObservationService(db)
    observations = await observation_service.get_by_type(session_id, event_type)
    return [ObservationResponse.model_validate(o) for o in observations]


@router.get("/session/{session_id}/recent", response_model=list[ObservationResponse])
async def get_recent_observations(
    session_id: UUID,
    minutes: int = Query(5, ge=1, le=60),
    db: AsyncSession = Depends(get_db),
):
    """Get recent observations."""
    observation_service = ObservationService(db)
    observations = await observation_service.get_recent(session_id, minutes)
    return [ObservationResponse.model_validate(o) for o in observations]


@router.get("/session/{session_id}/stats")
async def get_observation_stats(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get observation statistics."""
    observation_service = ObservationService(db)
    return await observation_service.get_stats(session_id)