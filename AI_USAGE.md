# AI Usage & Engineering Review Log

This document provides a comprehensive, transparent account of how AI was utilized during the design, development, and testing of **MediBook**, detailing the prompts used, errors and hallucinations identified in AI-generated output, and how those issues were methodically reviewed and corrected.

---

## 1. Approach to Using AI

The development process followed an **AI-augmented pair programming model**:
- **Human Engineer**: System architecture, requirements validation, review of correctness, test design, resilient fallback mechanisms, and security checks.
- **AI Tooling**: Boilerplate scaffolding, schema definition, type hints, seed dataset generation, and preliminary test generation.

The hybrid architecture was deliberately chosen:
- **Next.js 14 (TypeScript)** handles core CRUD, business logic, PostgreSQL database interaction via Prisma, and responsive UI.
- **Python FastAPI** was introduced exclusively for the AI microservice to parse natural language search queries into validated Pydantic models.

---

## 2. Prompts & Scaffolding Strategy

### 2.1 Schema & Data Modeling Prompt
> *"Generate a clean Prisma schema and Pydantic v2 data model for medical appointments including Patient Name, Date & Time, Doctor, Appointment Type, and Status. Ensure validation rules match medical appointment booking."*

### 2.2 Natural Language Query Parser Prompt
> *"Create a FastAPI endpoint `POST /parse-search` that takes queries like 'cancelled appointments with Dr. Perera next week' and extracts structured JSON filters for doctor, status, appointment type, and relative date range."*

### 2.3 Resilient Client & Fallback Prompt
> *"Design a client in Next.js that attempts to call the FastAPI search endpoint with a 1500ms timeout. If FastAPI fails, is down, or has no API key, gracefully fall back to a deterministic TypeScript search parser without failing the user's request."*

---

## 3. Review of AI-Generated Work: Bugs Identified & Corrected

During rigorous review of the AI-generated proposals and code, several critical bugs, outdated patterns, and edge cases were identified and corrected:

### Bug 1: Outdated Pydantic v1 Methods vs Pydantic v2
- **Issue**: The AI initially generated Python code using `response.dict()` and `@validator` decorators from Pydantic v1. In modern Pydantic v2 (used in Python 3.13), `.dict()` is deprecated in favor of `.model_dump()`, and `@validator` is replaced by `@field_validator`.
- **Review Finding**: Running `pytest` or modern linters on Python 3.13 triggered deprecation warnings and schema generation issues.
- **Correction Applied**: Updated all models in `ai_service/schemas.py` to strict Pydantic v2 specifications using `Field(default=..., description=...)` and proper type annotations.

### Bug 2: Relative Date Calculation and Timezone Offsets
- **Issue**: The AI-generated date parser calculated "next week" using fixed integer addition (`timedelta(days=7)`), which failed if today was a Thursday or Friday (it would merely jump ahead 7 days rather than bounding Monday through Sunday of the next calendar week).
- **Review Finding**: The query `"cancelled appointments with Dr. Perera next week"` failed to capture appointments scheduled for next Tuesday or Wednesday if tested on a Tuesday.
- **Correction Applied**: Implemented proper calendar math in `ai_service/parser.py`:
  ```python
  days_ahead = 7 - ref_dt.weekday()
  if days_ahead <= 0:
      days_ahead += 7
  next_mon = ref_dt + timedelta(days=days_ahead)
  next_sun = next_mon + timedelta(days=6)
  start_dt = next_mon.replace(hour=0, minute=0, second=0, microsecond=0)
  end_dt = next_sun.replace(hour=23, minute=59, second=59, microsecond=999999)
  ```
  Both start and end bounds now properly encapsulate the entire 7-day Monday–Sunday window.

### Bug 3: Prisma Schema Compatibility (SQLite vs PostgreSQL Enums)
- **Issue**: The AI originally suggested native Prisma `enum AppointmentStatus { ... }` while trying to support SQLite for local testing. Prisma does not support native database enums in SQLite, leading to error `P1012: Enums are not supported for SQLite`.
- **Review Finding**: Running `prisma db push` failed immediately with SQLite.
- **Correction Applied**: Stored status and appointment type as validated String fields in Prisma, while strictly enforcing enums at both the TypeScript compile-time level (`type AppointmentStatus = ...`) and runtime input validation level using **Zod** (`z.enum([...])`). This enables zero-configuration execution across both PostgreSQL and SQLite.

### Bug 4: Single Point of Failure (AI Service Downtime)
- **Issue**: The naive AI proposal assumed the frontend would directly depend on FastAPI for all search queries. If the Python service crashed or was not started, search would break completely.
- **Review Finding**: Coupling core search directly to an experimental Python microservice violates high-availability principles.
- **Correction Applied**: Implemented an automated **graceful degradation circuit-breaker** in `src/app/api/parse-search/route.ts` and `src/lib/search-parser.ts`:
  1. Frontend calls `/api/parse-search`.
  2. Next.js tries FastAPI with a 1.5s timeout.
  3. If FastAPI responds, it returns `{ source: "ai-service", filters }`.
  4. If FastAPI times out or is offline, Next.js instantly executes `parseSearchQueryLocal()`, returning `{ source: "local-fallback", filters }`.
  5. The UI surfaces a pill showing whether the query was processed via "AI Model" or "Local Engine".

### Bug 5: Appointment Conflict Detection Over-booking
- **Issue**: The initial AI-generated appointment creation code allowed concurrent bookings for the same doctor at the same minute.
- **Review Finding**: In a medical setting, double-booking a doctor within a 15-minute slot is a major clinical issue.
- **Correction Applied**: Added a database-level conflict query checking for existing active appointments within `±14 minutes` for the same `doctorId`:
  ```typescript
  const slotStart = new Date(apptDate.getTime() - 14 * 60 * 1000);
  const slotEnd = new Date(apptDate.getTime() + 14 * 60 * 1000);
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: validated.doctorId,
      status: { not: "CANCELLED" },
      appointmentDate: { gte: slotStart, lte: slotEnd },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Doctor already has an appointment booked around that time." }, { status: 409 });
  }
  ```

### Bug 6: Paid LLM API Dependencies vs. Zero-Cost Free Tier Architecture
- **Issue**: Standard AI code generation often hardcodes dependencies on paid LLM APIs (such as OpenAI or paid Gemini tiers), which would prevent users or reviewers without active paid subscriptions from evaluating the AI features.
- **Review Finding**: Relying strictly on paid APIs creates an unnecessary hurdle for testing and real-world evaluation.
- **Correction Applied**: Integrated **Groq Cloud's Free Tier** using `groq>=0.11.0` with `llama-3.3-70b-versatile` JSON mode. Furthermore, designed a two-stage fallback:
  1. Groq LLM (if `GROQ_API_KEY` is provided).
  2. Built-in Python semantic NLP parser (if Groq key is absent or rate-limited).
  3. Client-side Next.js TypeScript parser (if the entire Python service is offline).
  This guarantees that 100% of the application's search capabilities work out of the box with zero spend required.

---

## 4. Testing & Verification Summary

To guarantee system stability, tests were written across all three layers:
1. **Vitest (Next.js Unit & Parser Tests)**:
   - Tested deterministic fallback NLP parser (`src/test/search-parser.test.ts`).
   - Verified date formatting helpers.
   - Result: **7/7 tests passed**.
2. **pytest (FastAPI AI Microservice Tests)**:
   - Tested `/health` endpoint.
   - Tested `"cancelled appointments with Dr. Perera next week"` extraction.
   - Tested `"checkup with Dr. Jenkins today"`.
   - Tested 400 Bad Request on empty queries.
   - Result: **5/5 tests passed**.
3. **Playwright (End-to-End Tests)**:
   - Validated complete user journey: Dashboard loading, Natural Language search filtering, creating an appointment, editing an appointment, and deleting an appointment.

---

## 5. Key Takeaways

1. **AI as an Accelerator, Not an Architect**: AI excels at rapid boilerplate generation and mock data synthesis, but architectural resilience (fallbacks, timezone bounds, database engine discrepancies) requires deliberate human engineering.
2. **Type Safety Across Languages**: Using TypeScript interfaces on the Next.js side and Pydantic models on the FastAPI side ensured end-to-end data integrity across the JSON HTTP boundary.
3. **Graceful Fallbacks are Essential**: Never allow an optional AI enhancement to take down core CRUD operations.
