"""
API router aggregation.
"""
from fastapi import APIRouter

from app.api.v1 import auth, exams, sessions, answers, devices, observations, evidence, review, audit

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(answers.router, prefix="/answers", tags=["Answers"])
api_router.include_router(devices.router, prefix="/devices", tags=["Devices"])
api_router.include_router(observations.router, prefix="/observations", tags=["Observations"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
api_router.include_router(review.router, prefix="/review", tags=["Review"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])