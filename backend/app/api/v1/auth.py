"""
Authentication API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas import StudentLoginRequest, StudentLoginResponse, Token
from app.services.student_service import StudentService

router = APIRouter()


@router.post("/student", response_model=StudentLoginResponse)
async def student_login(
    request: StudentLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Student login with registered Student ID.
    
    Validates the student ID against the database, checks for active
    exam registration, and creates/resumes an exam session.
    """
    student_service = StudentService(db)
    result = await student_service.login(request)
    
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.message
        )
    
    return result


@router.post("/examiner")
async def examiner_login():
    """Examiner login - placeholder for future implementation."""
    # TODO: Implement examiner authentication
    return {"message": "Examiner login not yet implemented"}