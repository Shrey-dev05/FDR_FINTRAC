# FINTRAC — AICTE Security Deposit / FDR Management Portal
### Problem Statement 26265 | AICTE Regulation Bureau
**The Financial Control Room — Clarity, Control and Compliance**

---

## 1. Executive Summary & Goals

AICTE-related security deposit and Fixed Deposit Receipt (FDR) administration requires institution-wise canonical records, thorough document scrutiny, date-driven maturity monitoring, replacement tracking, and controlled release/refund workflows.

This repository implements a complete, responsive, full-stack web application built specifically for this purpose:
- **One Source of Truth**: Single canonical record for each instrument with full lifecycle history.
- **Strict Trust Model**: AI/OCR document extractions are machine suggestions only; human scrutiny officers retain authoritative review and decision power.
- **Idempotent Proximity Sweeps**: Automated monitoring for upcoming deadlines (30, 15, 7 days prior, due-today, and overdue) with deduplication keys.
- **Linked Renewals**: Successor instruments link directly to predecessor FDRs without overwriting historical records.
- **Separation of Duties**: Institutional applicants cannot approve their own release/refund requests; release completion requires explicit bank discharge evidence.
- **Immutable Audit Trail**: Append-only event ledger capturing actor provenance, timestamps, and state snapshots.

---

## 2. Seeded Demonstration Accounts

For hackathon evaluation and demonstration, the system includes pre-seeded demo accounts across all user roles. Use password `Password@123` for all accounts:

| Role | Name | Associated Institution / Desk | Email | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Institution User** | Dr. Ramesh Sharma | PNBC Institute of Technology (AICTE-DL-001) | `institution@aicte-demo.in` | Submit new FDRs, upload documents, view own portfolio, submit renewal/release requests. Scoped strictly to DL-001 (cannot access other institutions). |
| **Scrutiny Officer** | Smt. Sunita Rao | AICTE Northern Regional Bureau | `verifier@aicte-demo.in` | Examine documents, compare extracted suggestions, flag discrepancies, return for clarification, mark verified. |
| **Approving Authority** | Prof. Anil Sahasrabudhe | AICTE Regulation Bureau HQ | `approver@aicte-demo.in` | Review release/refund cases, approve/reject with mandatory rationale, complete discharge with reference. |
| **Portal Administrator** | System Administrator | AICTE IT Operations | `admin@aicte-demo.in` | User management, system settings, run proximity sweeps, monitor background jobs. |
| **Auditor** | Shri V. Ramakrishnan | CAG / AICTE Audit Board | `auditor@aicte-demo.in` | Read-only access to all verified records, document hashes, and immutable audit timeline. |

> **Tip:** The portal UI includes a **1-Click Demo Persona Switcher** in the top navigation bar and on the login page, allowing seamless switching between any of these roles during live demonstrations.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, React Router DOM v6.
- **Backend API**: Python FastAPI, Pydantic v2 schemas, typed REST API (`/api/v1`).
- **Database & ORM**: PostgreSQL / SQLite (SQLite zero-config local default), SQLAlchemy 2.0, Alembic migrations.
- **Security**: Argon2id/bcrypt password hashing, JWT bearer tokens, server-side role and institution scoping checks, SHA-256 document hashing.
- **Document Intelligence**: Simulated OCR extraction adapter with clear confidence scores and machine suggestion disclaimers.
- **Scheduler**: Idempotent sweep engine with deduplication keys and job run tracking.

---

## 4. Design System Tokens ("The Financial Control Room")

- **Midnight Navy**: `#14243A` (Primary navigation and major structural elements)
- **Deep Ink**: `#1D3048`
- **Muted Blue**: `#52677F`
- **Institutional Teal**: `#147D78` (Primary actions, confirmed positive states)
- **Soft Teal**: `#E3F3F0`
- **Warm Ivory**: `#F6F5F0` (Main application background)
- **Status Colors**:
  - Verified / Active: `#18794E` (`#E8F5ED`)
  - Pending Scrutiny: `#946200` (`#FFF4D6`)
  - Approaching Deadline: `#C47A13`
  - Critical / Overdue: `#C44242` (`#FDECEC`)
  - Informational / Query: `#315FC4` (`#EAF0FF`)
- **Typography**: Inter / sans-serif with tabular numerals for financial amounts (`tabular-nums`) and Indian currency formatting (`₹xx,xx,xxx.00`).

---

## 5. Local Setup & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Running the Backend
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m app.scripts.seed_demo
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Swagger Docs: `http://127.0.0.1:8000/api/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### Running the Frontend
```bash
cd frontend
npm install
npm run build
npm run preview -- --port 5173 --host 127.0.0.1
# Or for live HMR dev server:
# npm run dev
```
- Application Portal: `http://localhost:5173/`

### Running with Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 6. Automated Test Suite

Run backend automated tests covering authentication, IDOR scoping prevention, date/amount validation, idempotent sweep deduplication, verification decisions, and release separation-of-duties:

```bash
cd backend
.venv\Scripts\python.exe -m pytest -v
```

All 6 test suites pass with 100% assertions:
- `test_login_and_me`: Validates token issuance and user profile retrieval.
- `test_institution_scoping_idor_prevention`: Proves an institution user cannot list or open another institution's FDR (HTTP 403 Security policy violation).
- `test_fdr_date_and_amount_validation`: Ensures negative amounts and inverted dates are rejected with HTTP 422.
- `test_idempotent_reminder_sweep`: Proves executing the maturity reminder sweep twice produces zero duplicate notifications.
- `test_verification_decision_flow`: Validates verifier decision transitions and observation resolution.
- `test_release_separation_of_duties_and_completion`: Proves a submitter cannot approve their own release request, and release completion strictly requires official discharge reference.

---

## 7. Five-Minute Demonstration Narrative

1. **Official Dashboard (`verifier@aicte-demo.in`)**:
   - Inspect the **Maturity Horizon** timeline showing instruments grouped into Overdue, 7 Days, 30 Days, and 90 Days.
   - Click the 7-day segment to jump directly into the filtered register.
2. **Scrutiny Workspace (`verifier@aicte-demo.in`)**:
   - Open the **Verification Queue**. Select a pending FDR.
   - Compare the original document against simulated OCR suggestions.
   - Execute the **Simulated Bank Check** adapter (clearly marked as prototype sandbox).
   - Commit a verification decision (`VERIFY`) with mandatory official rationale.
3. **Institution FDR Submission (`institution@aicte-demo.in`)**:
   - Use the 1-Click Role Switcher to switch to the **Institution User**.
   - Navigate to **Submit New FDR** and walk through the 5-step wizard.
   - Drag and drop a document, inspect the real-time extraction preview, and submit.
4. **Maturity Sweeps & Deduplication (`admin@aicte-demo.in`)**:
   - Switch to **Admin** and open **Maturity Monitor**.
   - Click **Trigger Maturity Sweep**. Notice new notifications generated. Click it again immediately to prove 0 duplicate alerts are created.
5. **Release Workflow & Separation of Duties**:
   - Switch to **Institution User** and initiate a Release Request.
   - Switch to **Approving Authority** (`approver@aicte-demo.in`) to review and approve.
   - Complete the administrative discharge by recording the bank lien revocation reference (`AICTE-FIN-DISCHARGE-2026-00441`), transitioning the instrument to `Released / Closed`.
6. **Reports & Audit Trail**:
   - Open **Reports & Analytics** to inspect turnaround times and download CSV exports.
   - Open **Audit Explorer** to view the append-only chronological event ledger.
