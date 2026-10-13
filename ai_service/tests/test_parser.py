"""
Unit and integration tests for MediBook AI Search Parser using pytest and FastAPI TestClient.
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure ai_service is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from main import app
from parser import parse_query, rule_based_parse

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "medibook-ai-service"}


def test_parse_cancelled_perera_next_week():
    # Fixed reference date: Tuesday, Oct 13, 2026
    ref_date = "2026-10-13T12:00:00Z"
    response = client.post(
        "/parse-search",
        json={
            "query": "cancelled appointments with Dr. Perera next week",
            "referenceDate": ref_date,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    filters = data["filters"]
    assert filters["status"] == "CANCELLED"
    assert "Perera" in (filters["doctorName"] or "")
    assert filters["startDate"] is not None
    assert filters["endDate"] is not None
    # Next Monday should be 2026-10-19
    assert "2026-10-19" in filters["startDate"]


def test_parse_dr_jenkins_checkup_today():
    ref_date = "2026-10-13T12:00:00Z"
    response = client.post(
        "/parse-search",
        json={
            "query": "checkup with Dr. Jenkins today",
            "referenceDate": ref_date,
        },
    )
    assert response.status_code == 200
    data = response.json()
    filters = data["filters"]
    assert filters["appointmentType"] == "CHECKUP"
    assert "Jenkins" in (filters["doctorName"] or "")
    assert "2026-10-13" in filters["startDate"]


def test_parse_empty_query_returns_400():
    response = client.post("/parse-search", json={"query": "   "})
    assert response.status_code == 400


def test_parse_patient_name_extraction():
    res = rule_based_parse("appointments for Arthur Dent")
    assert res.filters.patientName == "Arthur Dent"
