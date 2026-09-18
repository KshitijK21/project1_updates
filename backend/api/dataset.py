from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import os, shutil, pandas as pd, uuid, json

from database.db import get_db, engine
from models.dataset import Dataset
from models.data_profile import DataProfile
from models.warehouse import Warehouse
from services.rbac_service import get_current_user, get_owned_dataset
from services.audit_service import log_action
from utils.file_io import load_dataframe

router = APIRouter(prefix="/datasets", tags=["Datasets"])
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"]


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db),
                         user=Depends(get_current_user)):
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")

    # Prefix the stored name with a uuid so datasets uploaded by different users
    # never collide on disk.
    stored_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = load_dataframe(file_path)
    except Exception:
        df = pd.read_csv(file_path, encoding="latin-1") if extension == ".csv" else pd.read_excel(file_path)

    existing = db.query(Dataset).filter(
        Dataset.uploaded_by == user.id,
        Dataset.name == file.filename,
        Dataset.row_count == len(df)
    ).first()
    if existing:
        os.remove(file_path)
        raise HTTPException(status_code=409, detail="A dataset with this filename and row count already exists. Delete the existing one first or upload a different file.")

    dataset = Dataset(
        id=uuid.uuid4(), name=file.filename, source_type=extension.replace(".", ""),
        status="uploaded", file_path=file_path, row_count=len(df), column_count=len(df.columns),
        uploaded_by=user.id
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    log_action(db, user.id, user.email, "UPLOAD_DATASET", f"/datasets/{dataset.id}")

    return {"dataset_id": str(dataset.id), "filename": file.filename,
            "rows": dataset.row_count, "columns": dataset.column_count, "status": "uploaded"}


@router.get("")
def list_datasets(db: Session = Depends(get_db), user=Depends(get_current_user)):
    datasets = db.query(Dataset).filter(Dataset.uploaded_by == user.id).order_by(Dataset.id.desc()).all()
    return [
        {
            "dataset_id": str(d.id),
            "filename": d.name,
            "rows": d.row_count,
            "columns": d.column_count,
            "status": d.status
        }
        for d in datasets
    ]


@router.get("/{dataset_id}/preview")
def preview_dataset(dataset: Dataset = Depends(get_owned_dataset), page: int = 1, per_page: int = 20,
                    db: Session = Depends(get_db)):
    ext = os.path.splitext(dataset.file_path)[1].lower()
    df = load_dataframe(dataset.file_path)

    per_page = max(1, min(per_page, 100))
    page = max(1, page)
    start = (page - 1) * per_page
    end = start + per_page
    total_rows = len(df)

    page_json = df.iloc[start:end].to_json(orient="records")
    page_data = json.loads(page_json)

    columns = [
        {"name": col, "dtype": str(df[col].dtype), "nulls": int(df[col].isnull().sum()),
         "uniques": int(df[col].nunique())}
        for col in df.columns
    ]

    return {
        "dataset_id": str(dataset.id),
        "filename": dataset.name,
        "rows": dataset.row_count,
        "columns": dataset.column_count,
        "column_info": columns,
        "preview": page_data,
        "page": page,
        "per_page": per_page,
        "total_rows": total_rows,
        "total_pages": (total_rows + per_page - 1) // per_page
    }


@router.delete("/{dataset_id}")
def delete_dataset(dataset: Dataset = Depends(get_owned_dataset), db: Session = Depends(get_db),
                   user=Depends(get_current_user)):
    dataset_id = dataset.id

    # Drop the warehouse fact table if it exists in Postgres.
    warehouses = db.query(Warehouse).filter(Warehouse.dataset_id == dataset_id).all()
    for w in warehouses:
        if w.fact_table_name:
            try:
                with engine.connect() as conn:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{w.fact_table_name}"'))
            except Exception:
                pass
        db.delete(w)

    db.query(DataProfile).filter(DataProfile.dataset_id == dataset_id).delete()

    # Remove the uploaded file from disk.
    if dataset.file_path and os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)

    db.delete(dataset)
    db.commit()

    log_action(db, user.id, user.email, "DELETE_DATASET", f"/datasets/{dataset_id}")

    return {"message": "Dataset deleted successfully", "dataset_id": str(dataset_id)}