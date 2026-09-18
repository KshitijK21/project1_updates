from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database.db import get_db, engine
from models.dataset import Dataset
from models.warehouse import Warehouse
from services.dashboard_service import get_kpis, get_chart_data, get_drilldown
from services.rbac_service import get_current_user, get_owned_dataset

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _get_warehouse(dataset: Dataset, db: Session) -> Warehouse:
    warehouse = db.query(Warehouse).filter(Warehouse.dataset_id == dataset.id).order_by(Warehouse.id.desc()).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Run warehouse generation first")
    return warehouse


@router.get("/{dataset_id}/kpis")
def dashboard_kpis(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                   user=Depends(get_current_user)):
    warehouse = _get_warehouse(dataset, db)
    kpis = get_kpis(warehouse.fact_table_name, warehouse.measures, engine)
    return {"dataset_id": str(dataset.id), "kpis": kpis}


@router.get("/{dataset_id}/chart")
def dashboard_chart(dataset: Dataset = Depends(get_owned_dataset), dimension: str = "", measure: str = "",
                    aggregation: str = "SUM", db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not dimension.strip() or not measure.strip():
        raise HTTPException(status_code=400, detail="dimension and measure query parameters are required")
    warehouse = _get_warehouse(dataset, db)
    data = get_chart_data(warehouse.fact_table_name, dimension, measure, aggregation, engine)
    return {"dataset_id": str(dataset.id), "dimension": dimension, "measure": measure, "aggregation": aggregation, "data": data}


@router.get("/{dataset_id}/summary")
def dashboard_summary(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                      user=Depends(get_current_user)):
    warehouse = _get_warehouse(dataset, db)
    kpis = get_kpis(warehouse.fact_table_name, warehouse.measures, engine)

    charts = []
    if warehouse.measures and warehouse.dimensions:
        primary_measure = warehouse.measures[0]["column"]
        for dim in warehouse.dimensions:
            chart_data = get_chart_data(warehouse.fact_table_name, dim["column"], primary_measure, "SUM", engine)
            charts.append({"dimension": dim["column"], "measure": primary_measure, "data": chart_data})

    total_rows = (sum(k["count"] for k in kpis) // len(kpis)) if kpis else 0

    return {
        "dataset_id": str(dataset.id),
        "kpis": kpis,
        "charts": charts,
        "total_rows": total_rows,
        "total_measures": len(warehouse.measures),
        "total_dimensions": len(warehouse.dimensions),
    }


@router.get("/{dataset_id}/drilldown")
def dashboard_drilldown(dataset: Dataset = Depends(get_owned_dataset), dimension: str = "", value: str = "",
                        db: Session = Depends(get_db), user=Depends(get_current_user)):
    warehouse = _get_warehouse(dataset, db)
    rows = get_drilldown(warehouse.fact_table_name, dimension, value, engine)
    return {"dataset_id": str(dataset.id), "dimension": dimension, "filtered_value": value, "row_count": len(rows), "rows": rows}