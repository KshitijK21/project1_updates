from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()
# Schema is managed by Alembic. Run "alembic upgrade head" from backend/
# before starting this service (docker-compose does this automatically).
from api import dataset as dataset_router, profiling, cleaning, warehouse as warehouse_router, ai, dashboard, predictive, auth, audit, report

app = FastAPI(title="Autonomous Business Intelligence Platform", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset_router.router)
app.include_router(profiling.router)
app.include_router(cleaning.router)
app.include_router(warehouse_router.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(predictive.router)
app.include_router(auth.router)
app.include_router(audit.router)
app.include_router(report.router)

@app.get("/")
def root():
    return {"message": "Autonomous BI Platform API is running"}