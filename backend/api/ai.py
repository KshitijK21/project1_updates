from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import logging
import re

from database.db import get_db, engine
from models.dataset import Dataset
from models.warehouse import Warehouse
from services.ai_service import generate_sql, explain_result
from services.rbac_service import get_current_user, get_owned_dataset

router = APIRouter(prefix="/ai", tags=["AI Analytics"])

FORBIDDEN_KEYWORDS = ["insert", "update", "delete", "drop", "alter", "truncate", "create"]


class AIQueryRequest(BaseModel):
    question: str


def fix_sql_case(sql: str, real_columns) -> str:
    """Make the model-generated SQL match the actual fact-table column names.

    The local LLM often capitalizes or mismatches quoted column names (e.g.
    "Revenue" vs "revenue"), which breaks execution. We only normalize the
    already-quoted identifiers (columns) back to the exact names in the schema,
    leaving SQL keywords untouched.
    """
    real_columns = list(real_columns)

    def repl(match):
        ident = match.group(1)
        for col in real_columns:
            if ident.lower() == col.lower():
                return f'"{col}"'
        return f'"{ident}"'

    # Only rewrite identifiers that are already wrapped in double quotes.
    sql = re.sub(r'"([^"]+)"', repl, sql)
    return sql


@router.post("/{dataset_id}/query")
def natural_language_query(dataset: Dataset = Depends(get_owned_dataset), request: AIQueryRequest = None,
                           question: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Accept the question either as a JSON body or as a query parameter.
    if request is not None and request.question.strip():
        question = request.question
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    warehouse = db.query(Warehouse).filter(Warehouse.dataset_id == dataset.id).order_by(Warehouse.id.desc()).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Run warehouse generation first")

    columns = [m["column"] for m in warehouse.measures] + [d["column"] for d in warehouse.dimensions]

    sql = generate_sql(question, warehouse.fact_table_name, columns)
    raw_sql = sql
    sql = fix_sql_case(sql, columns)
    logging.getLogger("uvicorn.error").warning(
        "AI query [%s]\n  raw : %s\n  fixed: %s", question, raw_sql, sql
    )

    # Safety check — block anything that isn't a pure SELECT
    if not sql.lower().strip().startswith("select"):
        raise HTTPException(status_code=400, detail="Generated query was not a SELECT statement")
    if any(keyword in sql.lower() for keyword in FORBIDDEN_KEYWORDS):
        raise HTTPException(status_code=400, detail="Generated query contained a forbidden operation")

    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            rows = [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL execution failed: {str(e)}")

    explanation = explain_result(question, rows)

    return {
        "question": question,
        "generated_sql": sql,
        "result": rows,
        "explanation": explanation
    }