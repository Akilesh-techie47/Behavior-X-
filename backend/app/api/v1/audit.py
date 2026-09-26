"""
Audit API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.schemas import AuditLogCreate, AuditLogResponse
from app.services.audit_service import AuditService
from app.models import ActorType

router = APIRouter()


@router.post("", response_model=AuditLogResponse, status_code=201)
async def create_audit_log(
    audit_data: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create an audit log entry."""
    audit_service = AuditService(db)
    audit = await audit_service.log(
        action=audit_data.action,
        actor_type=ActorType(audit_data.actor_type),
        actor_id=audit_data.actor_id,
        session_id=audit_data.session_id,
        student_id=audit_data.student_id,
        metadata=audit_data.metadata,
    )
    return AuditLogResponse.model_validate(audit)


@router.get("/session/{session_id}", response_model=list[AuditLogResponse])
async def get_session_audit_logs(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all audit logs for a session."""
    audit_service = AuditService(db)
    logs = await audit_service.get_by_session(session_id)
    return [AuditLogResponse.model_validate(l) for l in logs]


@router.get("/student/{student_id}", response_model=list[AuditLogResponse])
async def get_student_audit_logs(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all audit logs for a student."""
    audit_service = AuditService(db)
    logs = await audit_service.get_by_student(student_id)
    return [AuditLogResponse.model_validate(l) for l in logs]


@router.get("/recent", response_model=list[AuditLogResponse])
async def get_recent_audit_logs(
    hours: int = Query(24, ge=1, le=168),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Get recent audit logs."""
    audit_service = AuditService(db)
    logs = await audit_service.get_recent(hours, limit)
    return [AuditLogResponse.model_validate(l) for l in logs]


@router.get("/stats")
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get audit log statistics."""
    audit_service = AuditService(db)
    return await audit_service.get_stats()