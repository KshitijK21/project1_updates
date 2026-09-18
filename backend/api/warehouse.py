from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import os, uuid

from database.db import get_db
from models.dataset import Dataset
from models.warehouse import Warehouse
from services.warehouse_service import generate_star_schema
from services.rbac_service import get_current_user, get_owned_dataset
from utils.file_io import load_dataframe

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])


@router.post("/{dataset_id}/generate")
def generate_warehouse(dataset: Dataset = Depends(get_owned_dataset),
                       db: Session = Depends(get_db), user=Depends(get_current_user)):
    ext = os.path.splitext(dataset.file_path)[1].lower()
    df = load_dataframe(dataset.file_path)

    schema = generate_star_schema(df, dataset.name, str(dataset.id))
    from database.db import engine
    from services.warehouse_service import load_data_to_sql
    load_data_to_sql(df, schema["fact_table_name"], engine)

    warehouse = Warehouse(
        id=uuid.uuid4(),
        dataset_id=dataset.id,
        fact_table_name=schema["fact_table_name"],
        measures=schema["measures"],
        dimensions=schema["dimensions"],
        data_dictionary=schema["data_dictionary"]
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    return {
        "warehouse_id": str(warehouse.id),
        "dataset_id": str(dataset.id),
        "fact_table_name": warehouse.fact_table_name,
        "measures": warehouse.measures,
        "dimensions": warehouse.dimensions,
        "data_dictionary": warehouse.data_dictionary
    }


@router.get("/{dataset_id}")
def get_warehouse(dataset: Dataset = Depends(get_owned_dataset),
                  db: Session = Depends(get_db), user=Depends(get_current_user)):
    warehouse = db.query(Warehouse).filter(Warehouse.dataset_id == dataset.id).order_by(Warehouse.id.desc()).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Run POST /warehouse/{dataset_id}/generate first")

    return {
        "warehouse_id": str(warehouse.id),
        "fact_table_name": warehouse.fact_table_name,
        "measures": warehouse.measures,
        "dimensions": warehouse.dimensions,
        "data_dictionary": warehouse.data_dictionary
    }