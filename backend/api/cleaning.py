from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os

from database.db import get_db
from models.dataset import Dataset
from services.cleaning_service import generate_cleaning_suggestions, apply_cleaning
from services.rbac_service import get_current_user, get_owned_dataset
from utils.file_io import save_dataframe, load_dataframe

router = APIRouter(prefix="/cleaning", tags=["Cleaning"])


class ApplyCleaningRequest(BaseModel):
    suggestion_ids: list = []


@router.post("/{dataset_id}/suggestions")
def get_cleaning_suggestions(dataset: Dataset = Depends(get_owned_dataset),
                             db: Session = Depends(get_db), user=Depends(get_current_user)):
    ext = os.path.splitext(dataset.file_path)[1].lower()
    df = load_dataframe(dataset.file_path)

    suggestions = generate_cleaning_suggestions(df)

    return {
        "dataset_id": str(dataset.id),
        "total_suggestions": len(suggestions),
        "suggestions": suggestions
    }


@router.post("/{dataset_id}/apply")
def apply_selected_cleaning(payload: ApplyCleaningRequest,
                            dataset: Dataset = Depends(get_owned_dataset),
                            db: Session = Depends(get_db),
                            user=Depends(get_current_user)):
    ext = os.path.splitext(dataset.file_path)[1].lower()
    df = load_dataframe(dataset.file_path)

    applied = apply_cleaning(df, payload.suggestion_ids)

    save_dataframe(applied["dataframe"], dataset.file_path, ext)

    dataset.row_count = len(applied["dataframe"])
    dataset.column_count = len(applied["dataframe"].columns)
    db.commit()

    return {
        "dataset_id": str(dataset.id),
        "operations_applied": applied["operations"],
        "skipped": applied["skipped"],
        "rows_before": applied["rows_before"],
        "rows_after": applied["rows_after"],
        "rows_removed": applied["rows_before"] - applied["rows_after"]
    }