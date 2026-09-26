"""
Pydantic schemas for API requests and responses.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# --- Student Schemas ---
class StudentBase(BaseSchema):
    student_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    department: str = Field(..., min_length=1, max_length=100)
    year: int = Field(..., ge=1, le=10)
    section: str = Field(..., min_length=1, max_length=50)
    seat_number: Optional[str] = Field(None, max_length=50)
    accommodation_notes: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=100)
    year: Optional[int] = Field(None, ge=1, le=10)
    section: Optional[str] = Field(None, max_length=50)
    seat_number: Optional[str] = Field(None, max_length=50)
    accommodation_notes: Optional[str] = None
    status: Optional[str] = None


class StudentResponse(StudentBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime


class StudentLoginRequest(BaseSchema):
    student_id: str = Field(..., min_length=1, max_length=50)


class StudentLoginResponse(BaseSchema):
    success: bool
    message: Optional[str] = None
    student: Optional[StudentResponse] = None
    exam: Optional["ExamResponse"] = None
    session: Optional["ExamSessionResponse"] = None


# --- Exam Schemas ---
class QuestionBase(BaseSchema):
    question_number: int
    question_type: str
    question_text: str
    marks: int = 1
    options: Optional[str] = None  # JSON string
    correct_answer: Optional[str] = None
    guidance: Optional[str] = None
    starter_code: Optional[str] = None
    expected_seconds: int = 60
    section: Optional[str] = None


class QuestionCreate(QuestionBase):
    pass


class QuestionResponse(QuestionBase):
    id: UUID
    exam_id: UUID
    created_at: datetime


class ExamBase(BaseSchema):
    exam_code: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: int = Field(..., gt=0)


class ExamCreate(ExamBase):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExamUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class ExamResponse(ExamBase):
    id: UUID
    status: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    question_count: int = 0


class ExamDetailResponse(ExamResponse):
    questions: List[QuestionResponse] = []


# --- Registration Schemas ---
class ExamRegistrationBase(BaseSchema):
    student_id: UUID
    exam_id: UUID
    seat_number: Optional[str] = None


class ExamRegistrationCreate(ExamRegistrationBase):
    pass


class ExamRegistrationResponse(ExamRegistrationBase):
    id: UUID
    registration_status: str
    registered_at: datetime
    created_at: datetime
    updated_at: datetime
    student: Optional[StudentResponse] = None
    exam: Optional[ExamResponse] = None


# --- Session Schemas ---
class ExamSessionBase(BaseSchema):
    session_id: str
    student_id: UUID
    exam_id: UUID
    registration_id: Optional[UUID] = None
    status: str = "CREATED"
    duration_minutes: int = 60
    remaining_seconds: int = 0
    current_question: int = 1


class ExamSessionCreate(BaseSchema):
    student_id: UUID
    exam_id: UUID
    registration_id: Optional[UUID] = None
    duration_minutes: int = 60


class ExamSessionUpdate(BaseSchema):
    status: Optional[str] = None
    remaining_seconds: Optional[int] = None
    current_question: Optional[int] = None
    last_activity_at: Optional[datetime] = None


class ExamSessionResponse(ExamSessionBase):
    id: UUID
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    last_activity_at: Optional[datetime]
    total_seconds: int
    created_at: datetime
    updated_at: datetime
    student: Optional[StudentResponse] = None
    exam: Optional[ExamResponse] = None


class ExamSessionDetailResponse(ExamSessionResponse):
    answers: List["ExamAnswerResponse"] = []
    device_connections: List["DeviceConnectionResponse"] = []


# --- Answer Schemas ---
class ExamAnswerBase(BaseSchema):
    session_id: UUID
    question_id: UUID
    answer_text: Optional[str] = None
    is_marked_for_review: bool = False


class ExamAnswerCreate(ExamAnswerBase):
    student_id: UUID


class ExamAnswerUpdate(BaseSchema):
    answer_text: Optional[str] = None
    is_marked_for_review: Optional[bool] = None


class ExamAnswerResponse(ExamAnswerBase):
    id: UUID
    student_id: UUID
    answered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    question: Optional[QuestionResponse] = None


# --- Device Connection Schemas ---
class DeviceConnectionBase(BaseSchema):
    session_id: UUID
    device_type: str
    connection_id: Optional[str] = None
    status: str = "CONNECTING"


class DeviceConnectionCreate(DeviceConnectionBase):
    student_id: UUID


class DeviceConnectionUpdate(BaseSchema):
    status: Optional[str] = None
    connection_id: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class DeviceConnectionResponse(DeviceConnectionBase):
    id: UUID
    student_id: UUID
    connected_at: Optional[datetime]
    disconnected_at: Optional[datetime]
    last_seen_at: Optional[datetime]
    metadata: Optional[str]
    created_at: datetime
    updated_at: datetime


# --- Observation Schemas ---
class ObservationBase(BaseSchema):
    session_id: UUID
    event_type: str
    source: str
    timestamp: datetime
    confidence: float = 0.0
    metadata: Optional[Dict[str, Any]] = None


class ObservationCreate(ObservationBase):
    student_id: UUID


class ObservationResponse(ObservationBase):
    id: UUID
    student_id: UUID
    created_at: datetime


# --- Evidence Schemas ---
class EvidenceBase(BaseSchema):
    session_id: UUID
    evidence_type: str
    timestamp: datetime
    confidence: float = 0.0
    description: Optional[str] = None
    source: str


class EvidenceCreate(EvidenceBase):
    observation_id: Optional[UUID] = None


class EvidenceResponse(EvidenceBase):
    id: UUID
    observation_id: Optional[UUID]
    created_at: datetime


# --- Review Decision Schemas ---
class ReviewDecisionBase(BaseSchema):
    session_id: UUID
    decision: str
    note: Optional[str] = None


class ReviewDecisionCreate(ReviewDecisionBase):
    evidence_id: Optional[UUID] = None
    reviewer_id: str


class ReviewDecisionResponse(ReviewDecisionBase):
    id: UUID
    evidence_id: Optional[UUID]
    reviewer_id: str
    created_at: datetime


# --- Audit Log Schemas ---
class AuditLogBase(BaseSchema):
    action: str
    actor_type: str
    actor_id: str


class AuditLogCreate(AuditLogBase):
    session_id: Optional[UUID] = None
    student_id: Optional[UUID] = None
    metadata: Optional[Dict[str, Any]] = None


class AuditLogResponse(AuditLogBase):
    id: UUID
    session_id: Optional[UUID]
    student_id: Optional[UUID]
    timestamp: datetime
    metadata: Optional[str]


# --- Auth Schemas ---
class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseSchema):
    student_id: Optional[str] = None
    sub: Optional[str] = None


# --- Health Check ---
class HealthResponse(BaseSchema):
    status: str
    version: str
    database: str


# Forward references
StudentLoginResponse.model_rebuild()
ExamResponse.model_rebuild()
ExamSessionResponse.model_rebuild()
ExamSessionDetailResponse.model_rebuild()
ExamAnswerResponse.model_rebuild()
DeviceConnectionResponse.model_rebuild()