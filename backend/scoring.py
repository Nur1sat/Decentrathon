import json
import os
import re
import logging
from typing import Optional

import anthropic
from dotenv import load_dotenv

from prompts import build_prompt

load_dotenv()

logger = logging.getLogger(__name__)


class ScoringService:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-6"

    def score_candidate(self, candidate_data: dict) -> Optional[dict]:
        system_prompt, user_prompt = build_prompt(candidate_data)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            response_text = message.content[0].text.strip()
            return self._parse_response(response_text, candidate_data)

        except anthropic.APIError as e:
            logger.error(f"Anthropic API error for candidate {candidate_data.get('full_name')}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error scoring candidate {candidate_data.get('full_name')}: {e}")
            raise

    def _parse_response(self, response_text: str, candidate_data: dict) -> dict:
        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?\s*", "", response_text)
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to extract JSON object from the text
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(0))
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from response: {e}\nResponse: {response_text[:500]}")
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
        authenticity = clamp(data.get("authenticity_index", 50))
        ai_prob = clamp(data.get("ai_probability", 50))

        # Recalculate overall score with the defined weights
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

        return {
            "hard_skills_score": round(hard_skills, 1),
            "growth_trajectory": round(growth, 1),
            "leadership_potential": round(leadership, 1),
            "authenticity_index": round(authenticity, 1),
            "overall_score": round(overall, 1),
            "ai_probability": round(ai_prob, 1),
            "strengths": strengths,
            "risks": risks,
            "leadership_quotes": leadership_quotes,
            "reasoning": reasoning,
        }

    def _fallback_score(self, candidate_data: dict) -> dict:
        """Return a neutral fallback score when parsing fails."""
        return {
            "hard_skills_score": 50.0,
            "growth_trajectory": 50.0,
            "leadership_potential": 50.0,
            "authenticity_index": 50.0,
            "overall_score": 50.0,
            "ai_probability": 50.0,
            "strengths": ["Данные требуют дополнительной проверки"],
            "risks": ["Ошибка автоматического анализа — требуется ручная оценка"],
            "leadership_quotes": [],
            "reasoning": "Автоматический анализ завершился с ошибкой. Рекомендуется ручная проверка кандидата.",
        }
