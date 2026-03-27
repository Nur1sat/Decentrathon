import logging
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, create_tables
from models import (
    Candidate,
    Score,
    FeedbackLog,
    CandidateCreate,
    CandidateOut,
    CandidateDetailOut,
    ScoreOut,
    FeedbackCreate,
    FeedbackOut,
)
from scoring import ScoringService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="inVision Lens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    create_tables()
    logger.info("Database tables initialized.")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "inVision Lens API"}


@app.get("/candidates", response_model=List[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    result = []
    for c in candidates:
        latest_score = (
            db.query(Score)
            .filter(Score.candidate_id == c.id)
            .order_by(Score.created_at.desc())
            .first()
        )
        c_out = CandidateOut.model_validate(c)
        if latest_score:
            c_out.latest_score = ScoreOut.model_validate(latest_score)
        result.append(c_out)
    return result


@app.get("/candidates/{candidate_id}", response_model=CandidateDetailOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидат не найден")
    return CandidateDetailOut.model_validate(candidate)


@app.post("/candidates", response_model=CandidateOut, status_code=201)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return CandidateOut.model_validate(candidate)


@app.post("/candidates/{candidate_id}/score", response_model=ScoreOut)
def score_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидат не найден")

    try:
        service = ScoringService()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    candidate_data = {
        "full_name": candidate.full_name,
        "age": candidate.age,
        "school_type": candidate.school_type.value,
        "city": candidate.city,
        "achievements_text": candidate.achievements_text,
        "essay_text": candidate.essay_text,
    }

    try:
        score_data = service.score_candidate(candidate_data)
    except Exception as e:
        logger.error(f"Scoring failed for candidate {candidate_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Ошибка AI-анализа: {str(e)}")

    score = Score(candidate_id=candidate_id, **score_data)
    db.add(score)
    db.commit()
    db.refresh(score)
    return ScoreOut.model_validate(score)


@app.post("/candidates/{candidate_id}/feedback", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    candidate_id: int,
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидат не найден")

    feedback = FeedbackLog(candidate_id=candidate_id, **payload.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return FeedbackOut.model_validate(feedback)
