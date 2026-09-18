from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os

from database.db import get_db, engine
from models.dataset import Dataset
from models.data_profile import DataProfile
from models.warehouse import Warehouse
from services.report_service import generate_recommendations, generate_executive_summary
from services.pdf_service import generate_pdf_report
from services.ppt_service import generate_ppt_report
from services.dashboard_service import get_kpis
from services.anomaly_service import detect_anomalies
from services.rbac_service import get_current_user, get_owned_dataset
from utils.file_io import load_dataframe

router = APIRouter(prefix="/reports", tags=["Reports"])


def _gather_report_data(dataset: Dataset, db: Session):
    profile = db.query(DataProfile).filter(DataProfile.dataset_id == dataset.id).order_by(DataProfile.id.desc()).first()
    warehouse = db.query(Warehouse).filter(Warehouse.dataset_id == dataset.id).order_by(Warehouse.id.desc()).first()
    if not profile or not warehouse:
        raise HTTPException(status_code=400, detail="Run profiling and warehouse generation first")

    profile_data = {"health_score": profile.health_score, "missing_pct": profile.missing_pct, "duplicate_pct": profile.duplicate_pct}
    warehouse_data = {"measures": warehouse.measures, "dimensions": warehouse.dimensions}
    kpis = get_kpis(warehouse.fact_table_name, warehouse.measures, engine)

    df = load_dataframe(dataset.file_path)
    anomalies = detect_anomalies(df, warehouse.measures[0]["column"], 2.0) if warehouse.measures else []
    sample_data = df.head(10).fillna("").astype(str).to_dict(orient="records")

    return dataset, profile_data, warehouse_data, kpis, anomalies, sample_data


@router.get("/{dataset_id}/recommendations")
def get_recommendations(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                        user=Depends(get_current_user)):
    _, profile_data, warehouse_data, _, _, _ = _gather_report_data(dataset, db)
    recommendations = generate_recommendations(profile_data, warehouse_data)
    return {"dataset_id": str(dataset.id), "recommendations": recommendations}


@router.get("/{dataset_id}/executive-summary")
def get_executive_summary(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                          user=Depends(get_current_user)):
    _, profile_data, warehouse_data, kpis, _, _ = _gather_report_data(dataset, db)
    summary = generate_executive_summary(profile_data, warehouse_data, kpis)
    return {"dataset_id": str(dataset.id), "executive_summary": summary}


@router.get("/{dataset_id}/pdf")
def download_pdf_report(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                        user=Depends(get_current_user)):
    dataset, profile_data, warehouse_data, kpis, anomalies, _ = _gather_report_data(dataset, db)
    summary = generate_executive_summary(profile_data, warehouse_data, kpis)
    recommendations = generate_recommendations(profile_data, warehouse_data)
    filepath = generate_pdf_report(dataset.name.replace(".csv", ""), summary, kpis, recommendations, anomalies)
    return FileResponse(filepath, media_type="application/pdf", filename=os.path.basename(filepath))


@router.get("/{dataset_id}/ppt")
def download_ppt_report(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                        user=Depends(get_current_user)):
    dataset, profile_data, warehouse_data, kpis, anomalies, sample_data = _gather_report_data(dataset, db)
    summary = generate_executive_summary(profile_data, warehouse_data, kpis)
    recommendations = generate_recommendations(profile_data, warehouse_data)
    filepath = generate_ppt_report(dataset.name.replace(".csv", ""), summary, kpis, recommendations,
                                   anomalies, sample_data)
    return FileResponse(filepath, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename=os.path.basename(filepath))