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
| Natural Language Analytics | Ask questions in plain English — the platform generates and runs SQL against a semantic schema, self-heals broken queries and caches answers |
| Anomalies & Root Cause | Automatic detection plus written explanations of contributing factors |
| Forecasts | Time-series projections with trend annotations |
| Reports | Executive summary, KPIs, anomaly table and recommendations — exported as PDF or PowerPoint |
| Audit Log | Every significant action is recorded with actor, timestamp and endpoint |

## AI Querying — How It Works

Each question goes through a guarded pipeline:

1. **Semantic context** — the warehouse data dictionary (column types, roles,
   distinct counts, default aggregations) is injected into the LLM prompt so it
   picks correct functions and stops guessing column names.
2. **SQL generation** — the model produces a single `SELECT` (no write/DDL
   operations, no comments, no multiple statements).
3. **Self-healing** — every query is sanitized and checked against the schema. If
   execution fails (e.g. a type mismatch), the error is fed back to the model and
   it retries once with a corrected query before surfacing a readable `400`.
4. **Guards** — a 30s `statement_timeout` prevents runaway scans; results are
   capped at 200 rows (`truncated`/`total_rows` returned for the UI).
5. **Caching** — identical questions per dataset are cached for 5 minutes,
   cutting LLM latency and load.
6. **Audit** — each query logs an `AI_QUERY` action (actor, timestamp, endpoint).
7. **Explanation** — the model rewrites the rows as a short business answer.

The LLM runs through Ollama. Point it at any Ollama model via env config — a
small model is fine for development; swap in a larger one for production.

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in real values.

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://postgres:postgres123@localhost:5432/autonomous_bi` |
| `SECRET_KEY` | JWT signing secret — **required** | *none — service will not start* |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `OLLAMA_URL` | Ollama server base URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | LLM used for SQL/analysis | `qwen2.5:3b` |

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

# AI regression suite (requires the backend + Ollama running)
cd backend
python tests/eval_ai.py          # uses a fresh throwaway account + fixture dataset
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
