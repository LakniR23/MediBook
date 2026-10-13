"""
Pydantic v2 data models for the AI search parsing service.
"""

from typing import Optional
from pydantic import BaseModel, Field


class SearchQueryRequest(BaseModel):
    query: str = Field(..., description="Natural language search query entered by the user", min_length=1)
    referenceDate: Optional[str] = Field(
        default=None,
        description="ISO 8601 reference timestamp representing 'now' (for relative dates like 'tomorrow', 'next week')"
    )


class ParsedFilters(BaseModel):
    patientName: Optional[str] = Field(default=None, description="Extracted patient name, if detected")
    doctorName: Optional[str] = Field(default=None, description="Extracted doctor name or surname (e.g. Dr. Perera)")
    status: Optional[str] = Field(
        default=None,
        description="Standard appointment status: SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW"
    )
    appointmentType: Optional[str] = Field(
        default=None,
        description="Appointment type: CHECKUP, CONSULTATION, FOLLOW_UP, ROUTINE_EXAM, EMERGENCY, SPECIALIST_VISIT"
    )
    startDate: Optional[str] = Field(
        default=None,
        description="ISO 8601 start date timestamp for filtering range"
    )
    endDate: Optional[str] = Field(
        default=None,
        description="ISO 8601 end date timestamp for filtering range"
    )
    rawSearchTerm: Optional[str] = Field(
        default=None,
        description="Residual text to use for broad text search"
    )


class SearchQueryResponse(BaseModel):
    success: bool = Field(default=True, description="Whether parsing succeeded")
    filters: ParsedFilters = Field(description="Structured extracted filters")
    explanation: str = Field(description="Human-readable explanation of how the query was interpreted")
    mode: str = Field(default="ai", description="'llm' or 'rule_engine_nlp'")
