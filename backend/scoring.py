import json
import os
import re
import logging
from typing import Optional

from openai import OpenAI
from dotenv import load_dotenv

from prompts import build_prompt
from anonymization import anonymize_for_ai

load_dotenv()

logger = logging.getLogger(__name__)


class ScoringService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"

    def score_candidate(self, candidate_data: dict) -> Optional[dict]:
        # Anonymize PII before it reaches the AI model
        anon_data = anonymize_for_ai(candidate_data)
        system_prompt, user_prompt = build_prompt(anon_data)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=2048,
                response_format={"type": "json_object"},
            )
            response_text = response.choices[0].message.content.strip()
            return self._parse_response(response_text, candidate_data)

        except Exception as e:
            logger.error(f"OpenAI API error for candidate {candidate_data.get('full_name')}: {e}")
            raise

    def _parse_response(self, response_text: str, candidate_data: dict) -> dict:
        cleaned = re.sub(r"```(?:json)?\s*", "", response_text)
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(0))
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON: {e}\nResponse: {response_text[:500]}")
                    data = self._fallback_score(candidate_data)
            else:
                logger.error(f"No JSON found in response: {response_text[:500]}")
                data = self._fallback_score(candidate_data)

        return self._validate_and_normalize(data, candidate_data)

    def _validate_and_normalize(self, data: dict, candidate_data: dict) -> dict:
        def clamp(val, lo=0.0, hi=100.0) -> float:
            try:
                return max(lo, min(hi, float(val)))
            except (TypeError, ValueError):
                return 50.0

        hard_skills = clamp(data.get("hard_skills_score", 50))
        growth = clamp(data.get("growth_trajectory", 50))
        leadership = clamp(data.get("leadership_potential", 50))
        ai_prob = clamp(data.get("ai_probability", 50))

        # Three authenticity sub-axes
        reality_grounding = clamp(data.get("reality_grounding", 50))
        personal_experience = clamp(data.get("personal_experience", 50))
        originality = clamp(data.get("originality", 50))

        # authenticity_index = avg of three sub-axes (AI may also return directly; we recompute)
        authenticity = round((reality_grounding + personal_experience + originality) / 3, 1)

        overall = (
            hard_skills * 0.25
            + growth * 0.30
            + leadership * 0.25
            + authenticity * 0.20
        )

        strengths = data.get("strengths", [])
        if not isinstance(strengths, list):
            strengths = [str(strengths)]
        strengths = [str(s) for s in strengths[:3]]

        risks = data.get("risks", [])
        if not isinstance(risks, list):
            risks = [str(risks)]
        risks = [str(r) for r in risks[:2]]

        leadership_quotes = data.get("leadership_quotes", [])
        if not isinstance(leadership_quotes, list):
            leadership_quotes = []
        leadership_quotes = [str(q) for q in leadership_quotes[:2]]

        reasoning = data.get("reasoning", "Анализ завершён.")
        if not isinstance(reasoning, str):
            reasoning = str(reasoning)

        # Validate authenticity_fragments: [{quote, type, reason}]
        raw_fragments = data.get("authenticity_fragments", [])
        VALID_TYPES = {"ai_signal", "template", "authentic"}
        fragments = []
        essay_text = candidate_data.get("essay_text", "")
        if isinstance(raw_fragments, list):
            for f in raw_fragments[:10]:
                if not isinstance(f, dict):
                    continue
                quote = str(f.get("quote", "")).strip()
                ftype = str(f.get("type", "")).strip()
                reason = str(f.get("reason", "")).strip()
                # Only keep fragments that actually appear in the essay (case-insensitive check)
                if quote and ftype in VALID_TYPES and reason and quote.lower() in essay_text.lower():
                    fragments.append({"quote": quote, "type": ftype, "reason": reason})

        # Validate potential_triggers: [{quote, trigger_type, explanation}]
        VALID_TRIGGERS = {"leadership", "risk_taking", "social_impact", "innovation", "resilience"}
        raw_triggers = data.get("potential_triggers", [])
        triggers = []
        full_text = (candidate_data.get("essay_text", "") + " " + candidate_data.get("achievements_text", ""))
        if isinstance(raw_triggers, list):
            for t in raw_triggers[:8]:
                if not isinstance(t, dict):
                    continue
                quote = str(t.get("quote", "")).strip()
                ttype = str(t.get("trigger_type", "")).strip()
                explanation = str(t.get("explanation", "")).strip()
                if quote and ttype in VALID_TRIGGERS and explanation and quote.lower() in full_text.lower():
                    triggers.append({"quote": quote, "trigger_type": ttype, "explanation": explanation})

        return {
            "hard_skills_score": round(hard_skills, 1),
            "growth_trajectory": round(growth, 1),
            "leadership_potential": round(leadership, 1),
            "authenticity_index": authenticity,
            "reality_grounding": round(reality_grounding, 1),
            "personal_experience": round(personal_experience, 1),
            "originality": round(originality, 1),
            "overall_score": round(overall, 1),
            "ai_probability": round(ai_prob, 1),
            "strengths": strengths,
            "risks": risks,
            "leadership_quotes": leadership_quotes,
            "authenticity_fragments": fragments,
            "potential_triggers": triggers,
            "reasoning": reasoning,
        }

    def _fallback_score(self, candidate_data: dict) -> dict:
        return {
            "hard_skills_score": 50.0,
            "growth_trajectory": 50.0,
            "leadership_potential": 50.0,
            "authenticity_index": 50.0,
            "reality_grounding": 50.0,
            "personal_experience": 50.0,
            "originality": 50.0,
            "overall_score": 50.0,
            "ai_probability": 50.0,
            "strengths": ["Данные требуют дополнительной проверки"],
            "risks": ["Ошибка автоматического анализа — требуется ручная оценка"],
            "leadership_quotes": [],
            "authenticity_fragments": [],
            "reasoning": "Автоматический анализ завершился с ошибкой. Рекомендуется ручная проверка кандидата.",
        }

    def generate_validation_question(self, essay_text: str) -> str:
        prompt = f"""
Ты — опытный психолог и HR-специалист приемной комиссии элитной программы HI PO.
Твоя задача — проверить, не сгенерировано ли эссе кандидата нейросетью. 
Для этого прочитай эссе и задай ОДИН короткий, неформальный, узконаправленный вопрос по какой-либо конкретной детали, упомянутой в тексте (например, точное название проекта, трудность, имя упомянутого человека, специфическое чувство в определенный момент). 
Вопрос должен звучать так, будто его задает живой человек в мессенджере.
Если в эссе вообще нет конкретики, спроси что-то вроде: "Ты написал довольно общие вещи. Можешь привести ОДИН самый яркий пример из твоего опыта, когда тебе пришлось признать свою ошибку перед командой?"

Эссе кандидата:
{essay_text}

Выдай ТОЛЬКО текст вопроса, без кавычек и прелюдий.
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=256,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Failed to generate validation question: {e}")
            return "Привет! В твоем эссе есть интересные моменты. Расскажи самую сложную проблему, с которой ты столкнулся(ась) во время реализации описанного опыта?"
