"""
Query parser implementation.
Features:
1. Semantic Rule-based NLP extraction (fast, deterministic, zero-config offline capability).
2. Optional LLM enhancement (Gemini/OpenAI) if API key is present in environment.
"""

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from schemas import ParsedFilters, SearchQueryResponse


KNOWN_DOCTORS = [
    "Dr. Nimal Perera",
    "Dr. Sarah Jenkins",
    "Dr. Aisha Patel",
    "Dr. Marcus Vance",
    "Dr. Elena Rostova",
    "Dr. David Kim",
]

STATUS_KEYWORDS = {
    "cancelled": "CANCELLED",
    "canceled": "CANCELLED",
    "canceld": "CANCELLED",
    "confirmed": "CONFIRMED",
    "confirm": "CONFIRMED",
    "completed": "COMPLETED",
    "complete": "COMPLETED",
    "scheduled": "SCHEDULED",
    "schedule": "SCHEDULED",
    "upcoming": "SCHEDULED",
    "pending": "SCHEDULED",
    "no show": "NO_SHOW",
    "no-show": "NO_SHOW",
    "missed": "NO_SHOW",
}

TYPE_KEYWORDS = {
    "checkup": "CHECKUP",
    "check up": "CHECKUP",
    "check-up": "CHECKUP",
    "consultation": "CONSULTATION",
    "consult": "CONSULTATION",
    "follow up": "FOLLOW_UP",
    "follow-up": "FOLLOW_UP",
    "followup": "FOLLOW_UP",
    "routine": "ROUTINE_EXAM",
    "routine exam": "ROUTINE_EXAM",
    "exam": "ROUTINE_EXAM",
    "emergency": "EMERGENCY",
    "urgent": "EMERGENCY",
    "specialist": "SPECIALIST_VISIT",
}


def parse_relative_dates(text: str, ref_dt: datetime) -> Tuple[Optional[datetime], Optional[datetime], str]:
    """
    Parses relative temporal expressions from text and returns (start_dt, end_dt, cleaned_text).
    """
    text_lower = text.lower()
    start_dt = None
    end_dt = None
    matched_phrase = ""

    # "today"
    if re.search(r"\btoday\b", text_lower):
        matched_phrase = "today"
        start_dt = ref_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = ref_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

    # "tomorrow"
    elif re.search(r"\btomorrow\b", text_lower):
        matched_phrase = "tomorrow"
        tomorrow = ref_dt + timedelta(days=1)
        start_dt = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)

    # "yesterday"
    elif re.search(r"\byesterday\b", text_lower):
        matched_phrase = "yesterday"
        yesterday = ref_dt - timedelta(days=1)
        start_dt = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

    # "next week"
    elif re.search(r"\bnext week\b", text_lower):
        matched_phrase = "next week"
        # Days until next Monday
        days_ahead = 7 - ref_dt.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_mon = ref_dt + timedelta(days=days_ahead)
        next_sun = next_mon + timedelta(days=6)
        start_dt = next_mon.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = next_sun.replace(hour=23, minute=59, second=59, microsecond=999999)

    # "this week"
    elif re.search(r"\bthis week\b", text_lower):
        matched_phrase = "this week"
        mon = ref_dt - timedelta(days=ref_dt.weekday())
        sun = mon + timedelta(days=6)
        start_dt = mon.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = sun.replace(hour=23, minute=59, second=59, microsecond=999999)

    # "this month"
    elif re.search(r"\bthis month\b", text_lower):
        matched_phrase = "this month"
        start_dt = ref_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Approximate end of month
        next_m = ref_dt.replace(day=28) + timedelta(days=4)
        end_dt = (next_m - timedelta(days=next_m.day)).replace(hour=23, minute=59, second=59, microsecond=999999)

    cleaned = text
    if matched_phrase:
        cleaned = re.sub(rf"\b{re.escape(matched_phrase)}\b", "", text, flags=re.IGNORECASE).strip()

    return start_dt, end_dt, cleaned


def rule_based_parse(query: str, reference_date_str: Optional[str] = None) -> SearchQueryResponse:
    """
    Robust deterministic rule-based natural language parser.
    """
    if reference_date_str:
        try:
            # Handle ISO string with or without Z
            cleaned_ref = reference_date_str.replace("Z", "+00:00")
            ref_dt = datetime.fromisoformat(cleaned_ref)
        except Exception:
            ref_dt = datetime.now(timezone.utc)
    else:
        ref_dt = datetime.now(timezone.utc)

    # 1. Parse dates
    start_dt, end_dt, remaining_text = parse_relative_dates(query, ref_dt)

    # 2. Extract doctor
    detected_doctor = None
    # Check against known doctors and general "Dr. Surname" regex
    for doc in KNOWN_DOCTORS:
        surname = doc.split()[-1]
        pattern = rf"\b(?:dr\.?|doctor)?\s*{re.escape(surname)}\b"
        if re.search(pattern, remaining_text, flags=re.IGNORECASE):
            detected_doctor = doc
            remaining_text = re.sub(pattern, "", remaining_text, flags=re.IGNORECASE).strip()
            break

    if not detected_doctor:
        doc_match = re.search(r"\b(?:dr\.?|doctor)\s+([a-zA-Z]+)\b", remaining_text, flags=re.IGNORECASE)
        if doc_match:
            detected_doctor = f"Dr. {doc_match.group(1).capitalize()}"
            remaining_text = re.sub(r"\b(?:dr\.?|doctor)\s+[a-zA-Z]+\b", "", remaining_text, flags=re.IGNORECASE).strip()

    # 3. Extract status
    detected_status = None
    for kw, status_val in STATUS_KEYWORDS.items():
        pattern = rf"\b{re.escape(kw)}\b"
        if re.search(pattern, remaining_text, flags=re.IGNORECASE):
            detected_status = status_val
            remaining_text = re.sub(pattern, "", remaining_text, flags=re.IGNORECASE).strip()
            break

    # 4. Extract appointment type
    detected_type = None
    for kw, type_val in TYPE_KEYWORDS.items():
        pattern = rf"\b{re.escape(kw)}\b"
        if re.search(pattern, remaining_text, flags=re.IGNORECASE):
            detected_type = type_val
            remaining_text = re.sub(pattern, "", remaining_text, flags=re.IGNORECASE).strip()
            break

    # 5. Clean up noise words (appointments, with, for, on, in, at)
    noise_words = r"\b(?:appointments?|patients?|with|for|on|in|at|all|the|my|show|find|list|get)\b"
    residual = re.sub(noise_words, "", remaining_text, flags=re.IGNORECASE)
    residual = re.sub(r"\s+", " ", residual).strip()

    patient_name = None
    raw_search = None
    if residual:
        # If residual has 1-3 capitalized or simple words, could be patient name or keyword
        patient_name = residual.title() if len(residual.split()) <= 3 else None
        raw_search = residual

    # Explanation summary
    explanations = []
    if detected_doctor:
        explanations.append(f"Doctor: {detected_doctor}")
    if detected_status:
        explanations.append(f"Status: {detected_status}")
    if detected_type:
        explanations.append(f"Type: {detected_type}")
    if start_dt and end_dt:
        explanations.append(f"Date range: {start_dt.strftime('%b %d')} to {end_dt.strftime('%b %d, %Y')}")
    if patient_name:
        explanations.append(f"Patient search: '{patient_name}'")

    explanation_text = "Parsed query: " + (", ".join(explanations) if explanations else "Broad search")

    filters = ParsedFilters(
        patientName=patient_name,
        doctorName=detected_doctor,
        status=detected_status,
        appointmentType=detected_type,
        startDate=start_dt.isoformat() if start_dt else None,
        endDate=end_dt.isoformat() if end_dt else None,
        rawSearchTerm=raw_search,
    )

    return SearchQueryResponse(
        success=True,
        filters=filters,
        explanation=explanation_text,
        mode="rule_engine_nlp",
    )


def groq_llm_parse(query: str, reference_date_str: Optional[str] = None) -> Optional[SearchQueryResponse]:
    """
    Parses natural language queries using Groq's high-speed free LLaMA 3.3 model.
    Returns None if GROQ_API_KEY is not configured or if an error occurs.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key or not groq_api_key.strip():
        return None

    try:
        from groq import Groq
        import json

        client = Groq(api_key=groq_api_key.strip())
        ref_dt = reference_date_str or datetime.now(timezone.utc).isoformat()

        system_prompt = f"""You are a specialized clinical appointment query parser for MediBook.
Parse the user's natural language request into structured filters for database lookup.
Current Reference Timestamp (Now): {ref_dt}
Known Attending Doctors: {", ".join(KNOWN_DOCTORS)}
Valid Appointment Statuses: SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
Valid Appointment Types: CHECKUP, CONSULTATION, FOLLOW_UP, ROUTINE_EXAM, EMERGENCY, SPECIALIST_VISIT

Return ONLY a valid JSON object conforming to this exact structure:
{{
  "patientName": "string or null",
  "doctorName": "full doctor name or null (e.g. Dr. Nimal Perera)",
  "status": "one of the valid statuses or null",
  "appointmentType": "one of the valid types or null",
  "startDate": "ISO 8601 start timestamp or null (e.g. 2026-10-19T00:00:00Z)",
  "endDate": "ISO 8601 end timestamp or null (e.g. 2026-10-25T23:59:59Z)",
  "rawSearchTerm": "any residual search text or null",
  "explanation": "brief explanation of what was extracted"
}}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=400,
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        explanation = data.pop("explanation", f"Parsed via Groq LLM: {query}")
        filters = ParsedFilters(**data)

        return SearchQueryResponse(
            success=True,
            filters=filters,
            explanation=explanation,
            mode="groq_llm",
        )
    except Exception as e:
        print(f"Notice: Groq LLM parse encountered error ({e}). Seamlessly falling back to rule engine.")
        return None


def parse_query(query: str, reference_date_str: Optional[str] = None) -> SearchQueryResponse:
    """
    Main entrypoint:
    1. If GROQ_API_KEY is configured, queries Groq (Llama-3.3-70b) for LLM extraction.
    2. Gracefully falls back to deterministic rule-based semantic parser if Groq is unconfigured or fails.
    """
    groq_result = groq_llm_parse(query, reference_date_str)
    if groq_result:
        return groq_result

    return rule_based_parse(query, reference_date_str)

