import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from database import Base


class SchoolTypeEnum(str, enum.Enum):
    elite = "elite"
    regular = "regular"
    rural = "rural"


# ─── ORM Models ────────────────────────────────────────────────────────────────

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    school_type = Column(Enum(SchoolTypeEnum), nullable=False)
    city = Column(String(255), nullable=False)
    achievements_text = Column(Text, nullable=False)
    essay_text = Column(Text, nullable=False)
    # source: how the application was submitted (web_form, telegram, telegram_webapp, direct)
    source = Column(String(50), nullable=False, default="direct")
    
    status = Column(String(50), nullable=False, default="pending")  # pending, accepted, rejected
    
    tg_chat_id = Column(String(50), nullable=True)
    biometrics_data = Column(JSON, nullable=True)
    validation_question = Column(Text, nullable=True)
    validation_answer = Column(Text, nullable=True)
    has_passed_verification = Column(Boolean, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship(
        "Score",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="Score.created_at",
    )
    feedback_logs = relationship(
        "FeedbackLog",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="FeedbackLog.created_at",
    )


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    hard_skills_score = Column(Float, nullable=False)
    growth_trajectory = Column(Float, nullable=False)
    leadership_potential = Column(Float, nullable=False)
    # Authenticity composite + three sub-axes
    authenticity_index = Column(Float, nullable=False)
    reality_grounding = Column(Float, nullable=False, default=50.0)
    personal_experience = Column(Float, nullable=False, default=50.0)
    originality = Column(Float, nullable=False, default=50.0)
    overall_score = Column(Float, nullable=False)
    ai_probability = Column(Float, nullable=False)
    strengths = Column(JSON, nullable=False)
    risks = Column(JSON, nullable=False)
    leadership_quotes = Column(JSON, nullable=False)
    # [{quote, type, reason}] — AI-identified fragments in the essay
    authenticity_fragments = Column(JSON, nullable=False, default=list)
    # [{quote, trigger_type, explanation}] — potential signal moments
    potential_triggers = Column(JSON, nullable=False, default=list)
    reasoning = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="scores")


class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    field_name = Column(String(255), nullable=True)
    original_value = Column(String(255), nullable=True)
    agreed = Column(Boolean, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="feedback_logs")


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class CandidateCreate(BaseModel):
    full_name: str
    age: int
    school_type: SchoolTypeEnum
    city: str
    achievements_text: str
    essay_text: str
    source: str = "direct"


class ApplicationSubmit(BaseModel):
    """Public-facing schema for applicant self-submission."""
    full_name: str
    age: int
    school_type: SchoolTypeEnum
    city: str
    achievements_text: str
    essay_text: str
    source: str = "web_form"
    tg_chat_id: Optional[str] = None
    biometrics_data: Optional[dict] = None


class ApplicationResult(BaseModel):
    """Minimal response returned to applicants — no internal IDs exposed."""
    application_ref: str
    message: str


class ScoreOut(BaseModel):
    id: int
    candidate_id: int
    hard_skills_score: float
    growth_trajectory: float
    leadership_potential: float
    authenticity_index: float
    reality_grounding: float = 50.0
    personal_experience: float = 50.0
    originality: float = 50.0
    overall_score: float
    ai_probability: float
    strengths: List[str]
    risks: List[str]
    leadership_quotes: List[str]
    authenticity_fragments: List[dict] = []
    potential_triggers: List[dict] = []
    reasoning: str
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    field_name: Optional[str] = None
    original_value: Optional[str] = None
    agreed: bool
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    candidate_id: int
    field_name: Optional[str]
    original_value: Optional[str]
    agreed: bool
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateOut(BaseModel):
    id: int
    full_name: str
    age: int
    school_type: SchoolTypeEnum
    city: str
    achievements_text: str
    essay_text: str
    source: str = "direct"
    status: str = "pending"
    created_at: datetime
    latest_score: Optional[ScoreOut] = None

    class Config:
        from_attributes = True


class CandidateDetailOut(BaseModel):
    id: int
    full_name: str
    age: int
    school_type: SchoolTypeEnum
    city: str
    achievements_text: str
    essay_text: str
    source: str = "direct"
    status: str = "pending"
    created_at: datetime
    scores: List[ScoreOut] = []
    feedback_logs: List[FeedbackOut] = []

    class Config:
        from_attributes = True
