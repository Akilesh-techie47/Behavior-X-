"""
Review service for examiner review decisions.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ReviewDecision, DecisionKind, ExamSession
from app.schemas import ReviewDecisionCreate, ReviewDecisionResponse


class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, decision_data: ReviewDecisionCreate) -> ReviewDecision:
        """Create a new review decision."""
        decision = ReviewDecision(**decision_data.model_dump())
        self.db.add(decision)
        await self.db.flush()
        return decision

    async def get_by_session(self, session_id: UUID) -> List[ReviewDecision]:
        """Get all review decisions for a session."""
        result = await self.db.execute(
            select(ReviewDecision)
            .where(ReviewDecision.session_id == session_id)
            .order_by(ReviewDecision.created_at)
        )
        return result.scalars().all()

    async def get_by_id(self, decision_id: UUID) -> Optional["ReviewDecision"]:
        result = await self.db.execute(
            select(ReviewDecision).where(ReviewDecision.id == decision_id)
        )
        return result.scalar_one_or_none()

    async def create_decision(
        self,
        session_id: UUID,
        reviewer_id: str,
        decision: DecisionKind,
        note: Optional[str] = None,
        evidence_id: Optional[UUID] = None
    ) -> ReviewDecision:
        """Create a new review decision."""
        decision = ReviewDecision(
            session_id=session_id,
            reviewer_id=reviewer_id,
            decision=decision,
            note=note,
            evidence_id=evidence_id,
        )
        self.db.add(decision)
        await self.db.flush()
        return decision

    async def get_session_decisions(self, session_id: UUID) -> List[ReviewDecision]:
        """Get all decisions for a session."""
        result = await self.db.execute(
            select(ReviewDecision)
            .where(ReviewDecision.session_id == session_id)
            .order_by(ReviewDecision.created_at)
        )
        return result.scalars().all()

    async def get_session_summary(self, session_id: UUID) -> dict:
        """Get review summary for a session."""
        decisions = await self.get_session_decisions(session_id)
        
        counts = {}
        for d in decisions:
            counts[d.decision.value] = counts.get(d.decision.value, 0) + 1
        
        return {
            "total": len(decisions),
            "by_decision": counts,
            "latest": decisions[-1].created_at if decisions else None,
        }