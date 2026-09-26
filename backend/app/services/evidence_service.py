"""
Evidence service for managing evidence records.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Evidence, Observation
from app.schemas import EvidenceCreate, EvidenceResponse


class EvidenceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, evidence_data: EvidenceCreate) -> Evidence:
        """Create new evidence."""
        evidence = Evidence(**evidence_data.model_dump())
        self.db.add(evidence)
        await self.db.flush()
        return evidence

    async def get_by_session(self, session_id: UUID) -> List[Evidence]:
        """Get all evidence for a session."""
        result = await self.db.execute(
            select(Evidence)
            .where(Evidence.session_id == session_id)
            .order_by(Evidence.timestamp)
        )
        return result.scalars().all()

    async def get_by_observation(self, observation_id: UUID) -> List[Evidence]:
        """Get evidence linked to an observation."""
        result = await self.db.execute(
            select(Evidence).where(Evidence.observation_id == observation_id)
        )
        return result.scalars().all()

    async def create_from_observation(
        self,
        observation_id: UUID,
        evidence_type: str,
        confidence: float,
        description: str,
        source: str
    ) -> Evidence:
        """Create evidence from an observation."""
        obs_result = await self.db.execute(
            select(Observation).where(Observation.id == observation_id)
        )
        observation = obs_result.scalar_one_or_none()
        
        if not observation:
            raise ValueError("Observation not found")
        
        evidence = Evidence(
            session_id=observation.session_id,
            observation_id=observation_id,
            evidence_type=evidence_type,
            timestamp=observation.timestamp,
            confidence=confidence or observation.confidence,
            description=description,
            source=source,
        )
        self.db.add(evidence)
        await self.db.flush()
        return evidence

    async def get_session_summary(self, session_id: UUID) -> dict:
        """Get evidence summary for a session."""
        evidence_list = await self.get_by_session(session_id)
        
        by_type = {}
        total_confidence = 0
        for ev in evidence_list:
            by_type[ev.evidence_type] = by_type.get(ev.evidence_type, 0) + 1
            total_confidence += ev.confidence
        
        return {
            "total": len(evidence_list),
            "by_type": by_type,
            "avg_confidence": total_confidence / len(evidence_list) if evidence_list else 0,
        }