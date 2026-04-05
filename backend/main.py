import hashlib
import logging
import time
from collections import defaultdict
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Request
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
    ApplicationSubmit,
    ApplicationResult,
)
from scoring import ScoringService

# Simple in-memory rate limiter: max 3 submissions per IP per hour
_rate_limit: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_MAX = 3
_RATE_LIMIT_WINDOW = 3600  # seconds


def _check_rate_limit(ip: str) -> bool:
    """Return True if the IP is within the allowed rate."""
    now = time.time()
    timestamps = [t for t in _rate_limit[ip] if now - t < _RATE_LIMIT_WINDOW]
    _rate_limit[ip] = timestamps
    if len(timestamps) >= _RATE_LIMIT_MAX:
        return False
    _rate_limit[ip].append(now)
    return True


def _make_ref(candidate_id: int, full_name: str) -> str:
    """Generate a short opaque application reference shown to the applicant."""
    raw = f"{candidate_id}:{full_name}:hipo"
    return "APP-" + hashlib.sha256(raw.encode()).hexdigest()[:8].upper()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HI PO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # commission dashboard (dev)
        "http://127.0.0.1:5173",
        "http://localhost:5174",   # mobile applicant form (dev)
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
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
    return {"status": "ok", "service": "HI PO API"}


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


# ─── Public Applicant Submission ───────────────────────────────────────────────

@app.post("/apply", response_model=ApplicationResult, status_code=201)
def apply(
    payload: ApplicationSubmit,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public endpoint for applicant self-submission (web form or Telegram bot).

    - Rate-limited: max 3 submissions per IP per hour
    - Returns an opaque application reference (не раскрывает внутренний ID)
    - Marks the candidate record with its source channel
    """
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Слишком много заявок с этого адреса. Повторите попытку через час.",
        )

    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    ref = _make_ref(candidate.id, payload.full_name)
    logger.info(f"New application {ref} from {payload.source} (ip={client_ip})")

    return ApplicationResult(
        application_ref=ref,
        message=(
            "Ваша заявка успешно принята! Сохраните номер заявки: "
            f"{ref}. Мы свяжемся с вами после завершения отбора."
        ),
    )


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for the commission dashboard."""
    total = db.query(Candidate).count()
    scored_ids = [r[0] for r in db.query(Score.candidate_id).distinct().all()]
    scored = len(scored_ids)

    from sqlalchemy import func
    avg_row = db.query(func.avg(Score.overall_score)).scalar()
    avg_score = round(float(avg_row), 1) if avg_row else 0.0

    ai_flagged = (
        db.query(Score)
        .filter(Score.ai_probability > 60)
        .distinct(Score.candidate_id)
        .count()
    )

    by_source = {}
    for row in db.query(Candidate.source, func.count(Candidate.id)).group_by(Candidate.source).all():
        by_source[row[0]] = row[1]

    return {
        "total_candidates": total,
        "scored": scored,
        "avg_overall_score": avg_score,
        "ai_flagged": ai_flagged,
        "by_source": by_source,
    }
