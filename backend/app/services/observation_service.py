"""
Observation service for recording behavioral observations.
"""
from datetime import datetime
from typing import Optional, List, Dict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Observation, ExamSession
from app.schemas import ObservationCreate, ObservationResponse


class ObservationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, observation_data: ObservationCreate) -> Observation:
        """Create a new observation."""
        observation = Observation(**observation_data.model_dump())
        self.db.add(observation)
        await self.db.flush()
        return observation

    async def create_batch(self, observations: List[ObservationCreate]) -> List[Observation]:
        """Create multiple observations."""
        observation_objects = [Observation(**obs.model_dump()) for obs in observations]
        self.db.add_all(observation_objects)
        await self.db.flush()
        return observation_objects

    async def get_by_session(
        self, session_id: UUID, limit: int = 1000
    ) -> List[Observation]:
        """Get all observations for a session."""
        result = await self.db.execute(
            select(Observation)
            .where(Observation.session_id == session_id)
            .order_by(Observation.timestamp)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_type(
        self, session_id: UUID, event_type: str
    ) -> List[Observation]:
        """Get observations by type."""
        result = await self.db.execute(
            select(Observation).where(
                Observation.session_id == session_id,
                Observation.event_type == event_type
            ).order_by(Observation.timestamp)
        )
        return result.scalars().all()

    async def get_recent(
        self, session_id: UUID, minutes: int = 5
    ) -> List[Observation]:
        """Get recent observations within time window."""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        result = await self.db.execute(
            select(Observation).where(
                Observation.session_id == session_id,
                Observation.timestamp >= cutoff
            ).order_by(Observation.timestamp.desc())
        )
        return result.scalars().all()

    async def get_stats(self, session_id: UUID) -> Dict:
        """Get observation statistics for a session."""
        observations = await self.get_by_session(session_id)
        
        by_type = {}
        by_source = {}
        for obs in observations:
            by_type[obs.event_type] = by_type.get(obs.event_type, 0) + 1
            by_source[obs.source] = by_source.get(obs.source, 0) + 1
        
        return {
            "total": len(observations),
            "by_type": by_type,
            "by_source": by_source,
            "avg_confidence": sum(o.confidence for o in observations) / len(observations) if observations else 0,
        }

    async def record_event(
        self,
        session_id: UUID,
        student_id: UUID,
        event_type: str,
        source: str,
        confidence: float = 0.0,
        metadata: Optional[Dict] = None,
        timestamp: Optional[datetime] = None
    ) -> Observation:
        """Record a single observation event."""
        observation = Observation(
            session_id=session_id,
            student_id=student_id,
            event_type=event_type,
            source=source,
            timestamp=timestamp or datetime.utcnow(),
            confidence=confidence,
            metadata=str(metadata) if metadata else None,
        )
        self.db.add(observation)
        await self.db.flush()
        return observation