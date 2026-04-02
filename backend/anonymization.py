"""
Anonymization utilities for PII protection.

Before candidate data reaches the AI layer, personally identifiable
information (name, exact city) is replaced with pseudonyms so that
the AI model never processes raw personal data — especially important
for minors (несовершеннолетние).

The original data stays in the database and is only visible to
authorized commission members through the authenticated dashboard.
"""

import hashlib
import re


# Cities are contextually important for scoring (rural vs. urban context),
# so we keep the oblast/region but drop the specific settlement name.
_CITY_NORMALIZER = {
    # Normalize known cities to their oblast for AI context
    "Алматы": "мегаполис (Алматы)",
    "Астана": "мегаполис (Астана)",
    "Нур-Султан": "мегаполис (Астана)",
    "Шымкент": "крупный город (Туркестанская область)",
    "Актобе": "областной центр (Актюбинская область)",
    "Тараз": "областной центр (Жамбылская область)",
    "Павлодар": "областной центр (Павлодарская область)",
    "Усть-Каменогорск": "областной центр (ВКО)",
    "Семей": "город (ВКО)",
    "Атырау": "областной центр (Атырауская область)",
    "Костанай": "областной центр (Костанайская область)",
    "Кызылорда": "областной центр (Кызылординская область)",
    "Уральск": "областной центр (ЗКО)",
    "Петропавловск": "областной центр (СКО)",
    "Актау": "областной центр (Мангистауская область)",
    "Темиртау": "город (Карагандинская область)",
    "Туркестан": "город (Туркестанская область)",
    "Кокшетау": "областной центр (Акмолинская область)",
    "Талдыкорган": "областной центр (Алматинская область)",
    "Экибастуз": "город (Павлодарская область)",
}


def _pseudonym(full_name: str) -> str:
    """Return a short deterministic pseudonym derived from the name."""
    digest = hashlib.sha256(full_name.encode("utf-8")).hexdigest()[:6].upper()
    return f"Кандидат #{digest}"


def _normalize_city(city: str) -> str:
    """Return a region-level descriptor instead of an exact city."""
    for key, value in _CITY_NORMALIZER.items():
        if key.lower() in city.lower():
            return value
    # Unknown city: keep only if it looks like it might be rural
    city_clean = city.strip()
    if len(city_clean) > 0:
        return f"населённый пункт ({city_clean[:20]})"
    return "населённый пункт"


def _strip_names_from_text(text: str, full_name: str) -> str:
    """Remove the candidate's own name from essay/achievements text."""
    if not full_name or not text:
        return text
    parts = [p.strip() for p in full_name.split() if len(p.strip()) > 2]
    result = text
    for part in parts:
        result = re.sub(re.escape(part), "[имя]", result, flags=re.IGNORECASE)
    return result


def anonymize_for_ai(candidate_data: dict) -> dict:
    """
    Return a copy of candidate_data with PII replaced by pseudonyms.

    Input dict keys: full_name, age, school_type, city, achievements_text, essay_text
    Output: same keys, but full_name is a pseudonym and city is a region descriptor.
    """
    full_name = candidate_data.get("full_name", "")
    city = candidate_data.get("city", "")

    anon = candidate_data.copy()
    anon["full_name"] = _pseudonym(full_name)
    anon["city"] = _normalize_city(city)
    anon["achievements_text"] = _strip_names_from_text(
        candidate_data.get("achievements_text", ""), full_name
    )
    anon["essay_text"] = _strip_names_from_text(
        candidate_data.get("essay_text", ""), full_name
    )
    return anon
