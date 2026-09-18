from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from collections import OrderedDict
import logging
import re
import time

from database.db import get_db, engine
from models.dataset import Dataset
from models.warehouse import Warehouse
from services.ollama_service import generate_sql, explain_result, fix_sql_error
from services.audit_service import log_action
from services.rbac_service import get_current_user, get_owned_dataset

router = APIRouter(prefix="/ai", tags=["AI Analytics"])

FORBIDDEN_KEYWORDS = ["insert", "update", "delete", "drop", "alter", "truncate", "create"]

# ---- Query cache (per user question, 5 minute TTL) ----
_query_cache = OrderedDict()
CACHE_TTL_SECONDS = 300
CACHE_MAX_ENTRIES = 128

# ---- Execution guards ----
MAX_RESULT_ROWS = 200
STATEMENT_TIMEOUT_MS = 30000


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


def _strip_quoted(sql: str) -> str:
    """Remove quoted identifiers so forbidden-keyword checks don't false-positive
    on legitimate column names like "updated" or "created".
    """
    return re.sub(r'"[^"]*"', '', sql)


def _sanitize(sql: str) -> str:
    """Hard guardrails applied to every query before execution."""
    cleaned = sql.strip()
    cleaned = re.sub(r"```sql|```", "", cleaned).strip()
    cleaned = re.sub(r";+\s*$", "", cleaned)
    if ";" in cleaned:
        raise HTTPException(status_code=400, detail="Generated query contained multiple statements")
    if "--" in cleaned or "/*" in cleaned or "*/" in cleaned:
        raise HTTPException(status_code=400, detail="Generated query contained comments")
    if not cleaned.lower().lstrip().startswith("select"):
        raise HTTPException(status_code=400, detail="Generated query was not a SELECT statement")
    if any(keyword in _strip_quoted(cleaned).lower() for keyword in FORBIDDEN_KEYWORDS):
        raise HTTPException(status_code=400, detail="Generated query contained a forbidden operation")
    return cleaned


def _build_semantic_hint(warehouse: Warehouse):
    """Turn the warehouse data dictionary into compact context for the LLM so it
    picks correct functions (SUM on numeric measures, etc.) and stops guessing.
    """
    entries = warehouse.data_dictionary or []
    lines = []
    for e in entries[:15]:
        col = e.get("column")
        if not col:
            continue
        lines.append(
            f'- "{col}": type {e.get("data_type", "unknown")}, role {e.get("role", "unknown")}, '
            f'{e.get("distinct_values", 0)} distinct values, {e.get("null_count", 0)} nulls'
        )
    if warehouse.measures:
        agg = ", ".join(f'"{m["column"]}" -> {m.get("aggregation", "SUM")}' for m in warehouse.measures)
        lines.append(f"- default aggregation for measures: {agg}")
    if not lines:
        return None
    return "Columns (with schema details):\n" + "\n".join(lines) + "\n\nUse these details to select the right SQL functions (e.g. SUM/AVG only on numeric measures)."


def _safe_explain(question: str, rows: list) -> str:
    try:
        return explain_result(question, rows)
    except Exception:
        return f"Your question returned {len(rows)} matching row(s) from the dataset."


def _cache_get(key):
    item = _query_cache.get(key)
    if not item:
        return None
    if time.time() - item["ts"] > CACHE_TTL_SECONDS:
        _query_cache.pop(key, None)
        return None
    _query_cache.move_to_end(key)
    return item["payload"]


def _cache_put(key, payload):
    _query_cache[key] = {"ts": time.time(), "payload": payload}
    _query_cache.move_to_end(key)
    while len(_query_cache) > CACHE_MAX_ENTRIES:
        _query_cache.popitem(last=False)


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
    hint = _build_semantic_hint(warehouse)

    cache_key = (str(dataset.id), question.strip().lower())
    cached = _cache_get(cache_key)
    if cached is not None:
        return dict(cached, cached=True)

    sql = generate_sql(question, warehouse.fact_table_name, columns, semantic_hint=hint)
    raw_sql = sql
    sql = fix_sql_case(sql, columns)
    sql = _sanitize(sql)
    logging.getLogger("uvicorn.error").warning(
        "AI query [%s]\n  raw : %s\n  fixed: %s", question, raw_sql, sql
    )

    # Execute with a statement timeout; if the query fails, ask the model to fix
    # its own SQL once before giving up with a readable error.
    rows = None
    for attempt in range(2):
        try:
            with engine.connect() as conn:
                conn.execute(text(f"SET LOCAL statement_timeout = '{STATEMENT_TIMEOUT_MS}'"))
                result = conn.execute(text(sql))
                rows = [dict(row._mapping) for row in result]
            break
        except Exception as exc:  # noqa: BLE001 - surfaced to the caller as a friendly 400
            if attempt == 0:
                sql = fix_sql_error(question, warehouse.fact_table_name, columns, sql, str(exc), semantic_hint=hint)
                sql = fix_sql_case(sql, columns)
                sql = _sanitize(sql)
                logging.getLogger("uvicorn.error").warning(
                    "AI query retry\n  corrected : %s", sql
                )
            else:
                detail = str(exc).rsplit(":", 1)[-1].strip().splitlines()[0]
                raise HTTPException(status_code=400, detail=f"Could not generate a valid query: {detail}")

    truncated = len(rows) > MAX_RESULT_ROWS
    shown = rows[:MAX_RESULT_ROWS]

    payload = {
        "question": question,
        "generated_sql": sql,
        "result": shown,
        "explanation": _safe_explain(question, shown),
        "truncated": truncated,
        "total_rows": len(rows),
        "cached": False,
    }

    log_action(db, user.id, user.email, "AI_QUERY", f"/ai/{dataset.id}/query")
    _cache_put(cache_key, payload)
    return payload