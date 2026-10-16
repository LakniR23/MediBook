# AI Usage, Engineering Review & Evaluation Log

This document provides a comprehensive, transparent account of how AI was utilized during the design, development, and testing of **MediBook**, detailing the prompts used, errors and hallucinations identified in AI-generated output, and how those issues were methodically reviewed, corrected, and verified against all 8 project evaluation criteria.

---

## 🎯 Executive Summary: Alignment with the 8 Review Criteria

| Criteria | Implementation & Proof in MediBook | Evidence in Repository |
|---|---|---|
| **1. Application Works Correctly** | Full CRUD for appointments, PostgreSQL persistence, conflict prevention, real-time doctor shifts, multi-role auth, and Siri/Alexa-style Voice AI. | `src/app/`, `src/services/`, `prisma/schema.prisma` |
| **2. Code Quality & Structure** | Modular architecture, strict TypeScript types, Next.js App Router, Zod validation, Tailwind styling, service-oriented separation. | `src/types/`, `src/services/`, `src/lib/`, `ai_service/` |
| **3. Problem-Solving Approach** | Privacy-first design (sensitive medical details in modal), localized healthcare workflows (Sri Lankan shifts, phone validation), resilient fallback. | `src/app/patients/page.tsx`, `src/lib/shifts.ts` |
| **4. Use of AI** | Dual AI integration: 1) Natural Language NLP query parser with Groq Llama-3.3-70b/FastAPI, 2) Siri/Alexa-style Web Speech Voice AI assistant ("Medi"). | `ai_service/`, `src/services/voice-intent.service.ts` |
| **5. Review & Correction of AI Output** | Corrected 11 major AI errors/hallucinations (Pydantic v1 vs v2, double-booking, premature voice cutoffs, HUD text truncation, role assumptions). | Section 3 of this document |
| **6. Testing** | Multi-tier test pyramid: 55 unit/integration tests (Vitest), 5 AI microservice tests (pytest), 26 end-to-end tests (Playwright). Total: 86 automated tests. | `src/test/`, `ai_service/tests/`, `e2e/` |
| **7. Documentation** | Interactive Swagger/OpenAPI docs for both services, comprehensive README, architecture diagrams, Docker launch guides, AI review log. | `README.md`, `AI_USAGE.md`, `/docs`, FastAPI `/docs` |
| **8. Overall Usability** | Photorealistic 3D voice orb, zero-noise responsive UI, multi-line HUD subtitles, keyboard accessibility, shift badges, mobile-responsive layout. | `src/components/`, `src/app/` |

---

## 1. Approach to Using AI

The development process followed an **AI-augmented pair programming model**:
- **Human Engineer**: System architecture, requirements validation, review of correctness, test design, resilient fallback mechanisms, security/privacy checks, and UX refinement.
- **AI Tooling**: Boilerplate scaffolding, schema definition, type hints, seed dataset generation, and preliminary test generation.

The hybrid architecture was deliberately chosen:
- **Next.js 14 (TypeScript)** handles core CRUD, business logic, PostgreSQL database interaction via Prisma, user authentication, and responsive UI.
- **Python FastAPI** was introduced exclusively for the AI microservice to parse natural language search queries into validated Pydantic models.
- **Web Speech API & Voice Intent Engine** brings Siri/Alexa-style conversational clinical queries directly into the browser without third-party audio recording subscriptions.

---

## 2. Prompts & Scaffolding Strategy

### 2.1 Schema & Data Modeling Prompt
> *"Generate a clean Prisma schema and Pydantic v2 data model for medical appointments and patients including Patient Name, Date & Time, Doctor, Appointment Type, Status, Blood Type, and Medical Alerts. Ensure validation rules match medical appointment booking."*

### 2.2 Natural Language Query Parser Prompt
> *"Create a FastAPI endpoint `POST /parse-search` that takes queries like 'cancelled appointments with Dr. Perera next week' and extracts structured JSON filters for doctor, status, appointment type, and relative date range."*

### 2.3 Resilient Client & Fallback Prompt
> *"Design a client in Next.js that attempts to call the FastAPI search endpoint with a 1500ms timeout. If FastAPI fails, is down, or has no API key, gracefully fall back to a deterministic TypeScript search parser without failing the user's request."*

### 2.4 Voice AI Assistant Prompt
> *"Implement a voice assistant widget for clinical queries that activates on wake words ('Medi', 'Hey Medi'), listens to spoken queries about doctors, appointments, and patients, and replies verbally via Text-to-Speech."*

---

## 3. Review of AI-Generated Work: 11 Bugs Identified & Corrected

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

### Bug 6: Paid LLM API Dependencies vs. Zero-Cost Architecture
- **Issue**: Standard AI code generation often hardcodes dependencies on paid LLM APIs (such as OpenAI or paid Gemini tiers), which would prevent users or reviewers without active paid subscriptions from evaluating the AI features.
- **Review Finding**: Relying strictly on paid APIs creates an unnecessary hurdle for testing and real-world evaluation.
- **Correction Applied**: Integrated **Groq Cloud's Free Tier** using `groq>=0.11.0` with `llama-3.3-70b-versatile` JSON mode. Furthermore, designed a two-stage fallback:
  1. Groq LLM (if `GROQ_API_KEY` is provided).
  2. Built-in Python semantic NLP parser (if Groq key is absent or rate-limited).
  3. Client-side Next.js TypeScript parser (if the entire Python service is offline).

### Bug 7: Premature Voice Recognition Cutoff
- **Issue**: The initial AI voice recognition listener used a single short timeout (3 seconds) that restarted on every audio event, causing the microphone to cut off users before they finished formulating their medical question.
- **Review Finding**: Users speaking multi-word questions like *"What is patient Kavindu's blood type and what allergies does he have?"* were cut off mid-sentence.
- **Correction Applied**: Split the silence timer into a two-phase architecture:
  1. A generous **10-second initial silence timer** giving the user time to start speaking.
  2. A **2.5-second debounce pause timer** triggered only *after* active speech is detected, giving a natural human cadence before finalizing the query.

### Bug 8: AI Voice Speech Continuing Across Signout / Refresh
- **Issue**: The initial AI assistant did not monitor route changes or user session state. When a user signed out or refreshed on the `/login` page, the browser's `speechSynthesis` engine continued talking and listening in the background.
- **Review Finding**: The assistant spoke doctor greetings to unauthorized users on the public login page.
- **Correction Applied**:
  - Bound `window.speechSynthesis.cancel()` and `recognition.abort()` to route change listeners and session logout handlers.
  - Added strict route exclusion in `VoiceAssistantWidget.tsx`: returns `null` immediately on `/login` or `/register`.

### Bug 9: Privacy Leak of Sensitive Clinical Notes & Medical Details in Public Rosters
- **Issue**: The AI code generated a single patient table displaying medical history, allergies, and blood types directly alongside patient names and telephone numbers in the main directory table.
- **Review Finding**: Violates clinical privacy standards (HIPAA/GDPR) and clutters the interface for hospital staff scanning for administrative contacts.
- **Correction Applied**: Refactored `src/app/patients/page.tsx`:
  - Removed all clinical notes and sensitive data from the directory table.
  - Placed Blood Group, Allergies, Chronic Conditions, and Emergency Contacts inside a dedicated **Medical Details Modal** accessible only via explicit staff interaction ("Details" button).
  - Ensured the Voice Assistant can securely query and answer these medical details for authorized staff via voice queries.

### Bug 10: Role Generalization ("Dr." Assumption)
- **Issue**: The AI greeting logic hardcoded `"Hello Dr. [Name]"` on every login, assuming only medical doctors use the clinical system.
- **Review Finding**: Modern hospital management systems are actively operated by nurses, registrars, receptionists, and ward clerks. Greeting a nurse or receptionist as "Dr." is inaccurate and unprofessional.
- **Correction Applied**: Updated greeting logic in `VoiceAssistantContext.tsx` and `voice-intent.service.ts` to inspect the user's actual role:
  - If role is `"doctor"`, greet as `"Dr. [Name]"`.
  - If role is `"nurse"`, greet as `"Nurse [Name]"`.
  - For receptionists or general staff, greet as `"[Name]"`.

### Bug 11: Text Truncation in Voice HUD Subtitles
- **Issue**: The floating Siri/Alexa voice HUD subtitle paragraph used Tailwind's `truncate` class, causing long spoken transcripts and AI answers to cut off with an ellipsis (`...`) on a single line (e.g. *"open the patients page and tell me what appointm..."*).
- **Review Finding**: Users could not read the full question they spoke or the complete clinical answer provided by the assistant.
- **Correction Applied**: Replaced `truncate` with `break-words whitespace-normal` and expanded the responsive container width to `w-[calc(100vw-3rem)] max-w-sm sm:max-w-md md:max-w-lg`, allowing multi-line readable text for long queries and medical answers.

---

## 4. Testing & Verification Summary

To guarantee system stability, 86 automated tests were implemented across all three layers:

```
┌─────────────────────────────────────────────────────────────┐
│                 86 Automated Tests (100% Passing)           │
├───────────────────────┬─────────────────┬───────────────────┤
│ Test Suite            │ Framework       │ Status            │
├───────────────────────┼─────────────────┼───────────────────┤
│ Unit & Service Tests  │ Vitest          │ 55 / 55 Passed    │
│ AI Microservice Tests │ pytest          │  5 /  5 Passed    │
│ End-to-End E2E Tests  │ Playwright      │ 26 / 26 Passed    │
└───────────────────────┴─────────────────┴───────────────────┘
```

### Detailed Breakdown:
1. **Vitest (Next.js Unit & Service Tests - 55 Tests)**:
   - `shifts.test.ts` (6 tests): Validates Morning, Evening, Night, and Emergency on-call shift bounds, timezone formatting (SLST / UTC+5:30), and overnight wraparound.
   - `patient.service.test.ts` (5 tests): Validates patient CRUD, telephone format cleansing, and medical alert handling.
   - `formatters.test.ts` (12 tests): Validates date/time formatting, badge styling, status colors, and duration calculation.
   - `search-parser.test.ts` (7 tests): Validates local fallback NLP parser against doctors, dates, statuses, and types.
   - `voice-intent.service.test.ts` (25 tests): Validates voice intent classification, patient queries (blood types, allergies), doctor lookups, appointment counts, navigation intents, and role-aware greetings.

2. **pytest (FastAPI AI Microservice - 5 Tests)**:
   - `test_parser.py`: Validates `/health` check, Pydantic v2 validation, 400 Bad Request error handling, and semantic parameter extraction.

3. **Playwright (End-to-End User Journeys - 26 Tests)**:
   - Dashboard rendering, live auto-shift badges, natural language search filtering, appointment creation with conflict prevention, editing, deleting, doctor roster filtering by shift, patient medical modal privacy, and comprehensive Siri/Alexa Voice AI interaction without chat popups.

---

## 5. Key Engineering Lessons

1. **AI as an Accelerator, Not an Architect**: AI excels at rapid boilerplate generation and mock data synthesis, but architectural resilience (fallbacks, timezone bounds, privacy boundaries, database engine discrepancies) requires deliberate human engineering.
2. **Type Safety Across Languages**: Using TypeScript interfaces on the Next.js side and Pydantic models on the FastAPI side ensured end-to-end data integrity across the JSON HTTP boundary.
3. **Graceful Fallbacks are Essential**: Never allow an optional AI enhancement to take down core CRUD operations.
4. **Context & Tone Matter in Healthcare**: Hospital software serves diverse staff roles. AI prompts and responses must reflect accurate clinical roles, protect patient privacy, and deliver uninterrupted usability.
