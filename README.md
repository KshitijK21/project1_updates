# Autonomous Business Intelligence Platform

An end-to-end, AI-assisted BI tool: upload any CSV/Excel dataset and get
automatic data-quality profiling, one-click cleaning, an auto-generated star
schema, natural-language queries via an LLM, trend forecasts, anomaly detection,
root-cause analysis and shareable PDF/PowerPoint reports.

## Quick Start

### Prerequisites

* **Python 3.11+** and **Node.js 20+**
* **PostgreSQL 15+** (local or Docker)

### Run manually

```bash
# 1. Database
createdb autonomous_bi          # or use pgAdmin / psql

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows — source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
alembic upgrade head            # create all tables
uvicorn main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

* Frontend → http://localhost:3000
* Backend API → http://localhost:8000

### Run with Docker

```bash
docker compose up --build
```

PostgreSQL, the backend and the frontend start together; Alembic migrations
run automatically before the backend boots.

## Features

| Capability | What it does |
|---|---|
| Upload & Preview | Drag-and-drop CSV/Excel ingestion with row/column preview |
| Duplicate Prevention | Rejects repeated uploads of the same file for the same user |
| Data Quality | Automated health score, missing-value, outlier and correlation analysis |
| Cleaning | AI-guided suggestions for missing values, duplicates, outliers and mixed types |
| Star Schema Warehouse | Auto-generated fact table, dimensions and searchable data dictionary |
| Natural Language Analytics | Ask questions in plain English — the platform generates and runs SQL |
| Anomalies & Root Cause | Automatic detection plus written explanations of contributing factors |
| Forecasts | Time-series projections with trend annotations |
| Reports | Executive summary, KPIs, anomaly table and recommendations — exported as PDF or PowerPoint |
| Audit Log | Every significant action is recorded with actor, timestamp and endpoint |

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in real values.

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://postgres:postgres123@localhost:5432/autonomous_bi` |
| `SECRET_KEY` | JWT signing secret — **required** | *none — service will not start* |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |

Frontend variables (set in `.env.local` or via Docker `environment`):

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL the browser calls | `http://127.0.0.1:8000` |

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | FastAPI, SQLAlchemy 2, Alembic, Pandas, Scikit-learn, ReportLab, python-pptx |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Recharts, Lucide icons |
| Database | PostgreSQL 15 |
| AI/LLM | Ollama (local) |
| Infra | Docker Compose |

## Development

```bash
# Lint (frontend only — no custom config added yet)
cd frontend && npm run lint

# Schema after adding/changing a model
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Conventions

* Dark theme driven by CSS custom properties — prefer `text-text-primary`,
  `bg-surface-raised`, `border-border` etc. over hardcoded colours.
* Toasts for success/error feedback via `useToast()`.
* API errors return `{"detail": "message"}` (FastAPI `HTTPException`).

## Known Limitations

* No automated email delivery — verification and reset codes are printed to the
  backend console during development.
* In-memory rate limiter resets on backend restart; not suitable for horizontal
  scaling without Redis.

## License

Private — not for redistribution.
