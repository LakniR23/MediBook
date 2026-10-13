# MediBook — Medical Appointment Management Application

A full-stack, responsive medical appointment scheduling application with **AI-assisted natural language search**, built using a resilient hybrid architecture:
- **Core Full-Stack Web App**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL.
- **AI Microservice**: Python 3.13, FastAPI, Pydantic v2 for natural language query parsing.
- **Resilient Fallback**: Zero-failure graceful degradation—if the AI service is offline, queries are handled seamlessly by a local TypeScript parser.

---

## 🌟 Feature Checklist

- [x] **Create Appointments**: Schedule appointments with patient details, doctor, date/time, appointment type, and status. Includes automatic doctor schedule conflict detection (15-minute slot protection).
- [x] **View Appointments**: Responsive desktop tabular view and mobile-friendly card layouts.
- [x] **Edit Appointments**: Modify patient information, date/time, doctor, type, or clinical notes.
- [x] **Delete Appointments**: Safe confirmation dialog to prevent accidental deletion.
- [x] **Quick Status Updates**: One-click toggles to mark appointments Confirmed, Cancelled, or Completed.
- [x] **Search & Multi-Criteria Filtering**: Filter by doctor, status, appointment type, or date range.
- [x] **AI Natural Language Search**: Type plain-English queries such as:
  - *"cancelled appointments with Dr. Perera next week"*
  - *"checkup with Dr. Jenkins today"*
  - *"confirmed consultations"*
- [x] **Firebase Authentication**: Login and registration supporting both **Email & Password** and **Phone Number with SMS OTP verification**, complete with an instant 1-Click Receptionist Demo Login.
- [x] **KPI & Stats Summary**: Instant overview cards (Total Scheduled, Appointments Today, Confirmed, Cancelled, Completed).
- [x] **Comprehensive Testing**: Unit tests (**Vitest**), API & AI tests (**pytest**), and End-to-End tests (**Playwright**).
- [x] **Container Orchestration**: Production-ready `docker-compose.yml` for Next.js, FastAPI, and PostgreSQL.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Web Browser (User)                   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (Port 3000)
┌───────────────────────────▼────────────────────────────┐
│                    Next.js Core App                    │
│  - React 18 App Router UI with Tailwind CSS            │
│  - REST API Handlers (/api/appointments, /api/doctors)  │
│  - Deterministic Fallback Search Parser (TypeScript)   │
│  - Prisma Client ORM                                   │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
  POST /parse-search (Port 8000)          │ Database Queries (5432)
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│     FastAPI AI Service      │ │  PostgreSQL Database   │
│  - Pydantic v2 Validation   │ │  - Doctors Table       │
│  - Smart Query Parser       │ │  - Appointments Table  │
│  - Relative Date Math (UTC) │ └────────────────────────┘
└─────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Core Web App** | Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, date-fns, Zod |
| **ORM & Database** | Prisma ORM, PostgreSQL (also compatible with SQLite) |
| **AI Microservice** | Python 3.13, FastAPI, Pydantic v2, Groq SDK (Llama-3.3-70b Free Tier), Uvicorn, httpx |
| **Testing** | Vitest (Next.js unit tests), pytest (AI service), Playwright (E2E) |
| **DevOps** | Docker, Docker Compose, Multi-stage Dockerfiles |

---

## 🚀 Quick Start Guide

### Option A: Local Development (Recommended)

#### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (or SQLite)

#### 2. Install Next.js Dependencies & Setup Database
```bash
# 1. Install Node packages
npm install

# 2. Push schema to database
npx prisma db push

# 3. Seed fictional test data (6 doctors, 14 diverse appointments)
npm run db:seed
```

#### 3. Setup Python FastAPI AI Service
```bash
# In Windows PowerShell:
python -m venv ai_service/venv
.\ai_service\venv\Scripts\pip install -r ai_service\requirements.txt

# Start FastAPI server (Port 8000)
.\ai_service\venv\Scripts\python ai_service/main.py
```

#### 4. Start Next.js Development Server
In a second terminal:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

### Option B: Docker Compose (One-Command Launch)

Spins up Next.js (port 3000), FastAPI (port 8000), and PostgreSQL (port 5432) in isolated containers:
```bash
docker compose up --build
```
The application will automatically initialize the database, seed test data, and be accessible at **[http://localhost:3000](http://localhost:3000)**.

---

## 📑 Interactive Swagger & OpenAPI Documentation

MediBook comes equipped with interactive Swagger UI and OpenAPI specifications across both microservices:

| Service | Swagger UI URL | OpenAPI JSON Spec |
|---|---|---|
| **Core Web App (Next.js)** | **[http://localhost:3000/docs](http://localhost:3000/docs)** | `http://localhost:3000/api/openapi.json` |
| **AI Microservice (FastAPI)** | **[http://localhost:8000/docs](http://localhost:8000/docs)** | `http://localhost:8000/openapi.json` |
| **FastAPI ReDoc** | **[http://localhost:8000/redoc](http://localhost:8000/redoc)** | — |

> **Pro-Tip**: You can also click the **"Swagger API Docs"** button in the top navigation bar of the dashboard at [http://localhost:3000](http://localhost:3000) to open the interactive documentation page with live "Try it out" execution.

---

## 🧪 Running the Automated Tests

### 1. Vitest (Core App & Fallback Search Parser)
```bash
npm test
```
*Validates query normalization, doctor recognition, date formatting, and local fallback parsing.*

### 2. pytest (FastAPI AI Service)
```bash
.\ai_service\venv\Scripts\pytest .\ai_service\tests\test_parser.py -v
```
*Validates health checks, Pydantic schemas, 400 Bad Request handling, and natural language extraction.*

### 3. Playwright (End-to-End User Journeys)
```bash
npx playwright test
```
*Tests the full browser flow: dashboard rendering, natural language search, appointment creation, editing, and deletion.*

---

## 🔍 Resilient Fallback Architecture

To ensure the core medical application never fails if the experimental AI microservice is offline:
1. Next.js calls `POST /api/parse-search` with a **1.5-second abort controller**.
2. If the FastAPI service responds, structured filters are returned with badge `"AI Parsed"`.
3. If the FastAPI service is unreachable or errors out, Next.js **seamlessly triggers the local TypeScript regex/NLP engine**, returning filters with badge `"Local Parsed"`.
4. Users experience zero downtime or disruption regardless of AI service state.

---

## 📋 Fictional Test Dataset

All medical data is strictly fictional:
- **Doctors**: Dr. Nimal Perera (General Medicine), Dr. Sarah Jenkins (Cardiology), Dr. Aisha Patel (Pediatrics), Dr. Marcus Vance (Orthopedics), Dr. Elena Rostova (Dermatology), Dr. David Kim (Neurology).
- **Patients**: Arthur Dent, Clara Oswald, Miles Morales, Diana Prince, Samantha Reed, Robert Paulson, Peter Parker, Bruce Wayne, etc.
- **Statuses**: `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
- **Types**: `CHECKUP`, `CONSULTATION`, `FOLLOW_UP`, `ROUTINE_EXAM`, `EMERGENCY`, `SPECIALIST_VISIT`.

---

## 📖 AI Usage & Review Documentation

A detailed report documenting how AI was utilized, specific errors/hallucinations identified (such as Pydantic v1 deprecations, SQLite enum incompatibilities, relative date calendar math, and double-booking edge cases), and how they were reviewed and corrected can be found in:

📄 **[AI_USAGE.md](AI_USAGE.md)**
