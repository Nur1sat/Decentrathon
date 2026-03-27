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
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
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
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("Score", back_populates="candidate", cascade="all, delete-orphan")
    feedback_logs = relationship("FeedbackLog", back_populates="candidate", cascade="all, delete-orphan")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    hard_skills_score = Column(Float, nullable=False)
    growth_trajectory = Column(Float, nullable=False)
    leadership_potential = Column(Float, nullable=False)
    authenticity_index = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)
    ai_probability = Column(Float, nullable=False)
    strengths = Column(JSON, nullable=False)
    risks = Column(JSON, nullable=False)
    leadership_quotes = Column(JSON, nullable=False)
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


class ScoreOut(BaseModel):
    id: int
    candidate_id: int
    hard_skills_score: float
    growth_trajectory: float
    leadership_potential: float
    authenticity_index: float
    overall_score: float
    ai_probability: float
    strengths: List[str]
    risks: List[str]
    leadership_quotes: List[str]
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
    created_at: datetime
    scores: List[ScoreOut] = []
    feedback_logs: List[FeedbackOut] = []

    class Config:
        from_attributes = True
