import hashlib
import logging
import time
import os
import httpx
from dotenv import load_dotenv
from collections import defaultdict
from typing import List, Optional

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

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


async def send_telegram_message(chat_id: str, text: str):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    try:
        async with httpx.AsyncClient() as client:
            await client.post(url, json=payload, timeout=10)
    except Exception as e:
        logger.error(f"Failed to send telegram message to {chat_id}: {e}")

@app.post("/apply/web", response_model=ApplicationResult, status_code=201)
async def apply_web(
    payload: ApplicationSubmit,
    db: Session = Depends(get_db),
):
    """
    Endpoint specifically for the Telegram WebApp flow.
    Saves biometrics, generates AI validation question, and pushes it to Telegram.
    """
    candidate = Candidate(
        full_name=payload.full_name,
        age=payload.age,
        school_type=payload.school_type,
        city=payload.city,
        achievements_text=payload.achievements_text,
        essay_text=payload.essay_text,
        source=payload.source,
        tg_chat_id=payload.tg_chat_id,
        biometrics_data=payload.biometrics_data,
        has_passed_verification=False
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    ref = _make_ref(candidate.id, payload.full_name)
    logger.info(f"New application {ref} via WebApp with Biometrics! (tg={payload.tg_chat_id})")

    # Generate validation question
    if payload.tg_chat_id:
        try:
            service = ScoringService()
            question = service.generate_validation_question(payload.essay_text)
            candidate.validation_question = question
            db.commit()
            
            # Send question directly via Telegram API
            msg = (
                f"🧠 *HI PO AI Verification*\n\n"
                f"Мы получили твое эссе! Чтобы подтвердить авторство и перейти к следующему этапу, ответь на ИИ-вопрос по твоему тексту:\n\n"
                f"👉 _{question}_\n\n"
                f"(Напиши ответ ответным сообщением или запиши голосовое)"
            )
            await send_telegram_message(payload.tg_chat_id, msg)
        except Exception as e:
            logger.error(f"Error generating/sending validation question: {e}")

    return ApplicationResult(
        application_ref=ref,
        message="Заявка принята, ожидайте вопрос в Telegram."
    )

class TelegramAnswer(BaseModel):
    tg_chat_id: str
    answer_text: str

@app.post("/telegram/verify_answer")
async def verify_answer(
    payload: TelegramAnswer,
    db: Session = Depends(get_db),
):
    candidate = db.query(Candidate).filter(
        Candidate.tg_chat_id == payload.tg_chat_id
    ).order_by(Candidate.id.desc()).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Кандидат не найден")

    candidate.validation_answer = payload.answer_text
    candidate.has_passed_verification = True
    db.commit()

    # Trigger final scoring
    try:
        service = ScoringService()
        candidate_data = {
            "full_name": candidate.full_name,
            "age": candidate.age,
            "school_type": candidate.school_type.value,
            "city": candidate.city,
            "achievements_text": candidate.achievements_text,
            "essay_text": candidate.essay_text,
            "biometrics_data": candidate.biometrics_data,
            "validation_question": candidate.validation_question,
            "validation_answer": candidate.validation_answer
        }
        score_data = service.score_candidate(candidate_data)
        
        score = Score(candidate_id=candidate.id, **score_data)
        db.add(score)
        db.commit()
        db.refresh(score)
        
        return {
            "status": "success", 
            "authenticity_index": score.authenticity_index,
            "score": score.overall_score
        }
    except Exception as e:
        logger.error(f"Error during final scoring: {e}")
        raise HTTPException(status_code=500, detail="Scoring error")

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
