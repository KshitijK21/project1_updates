"""Regression harness for the natural-language query pipeline.

Spans the live API. Either points EVAL_DATASET_ID at an existing, warehouse-ready
dataset, or uploads the bundled fixture CSV and generates its warehouse first.

Usage (from backend/, with the API running on http://127.0.0.1:8000):
    set EVAL_EMAIL=you@example.com   set EVAL_PASSWORD=YourPass123!  (existing account)
    python tests/eval_ai.py
"""

import os
import random
import requests
import sys
import uuid

BASE = os.getenv("EVAL_BASE", "http://127.0.0.1:8000")
EMAIL = os.getenv("EVAL_EMAIL", "")
PASSWORD = os.getenv("EVAL_PASSWORD", "")
DATASET_ID = os.getenv("EVAL_DATASET_ID", "")
FIXTURE = os.path.join(os.path.dirname(__file__), "data", "sample_sales.csv")

QUESTIONS = [
    ("total amount by region", "Show the total amount by each region"),
    ("average per category", "What is the average amount per category?"),
    ("top region by revenue", "Which region contributes the most total amount?"),
    ("units by status", "Show the total units sold for each status"),
    ("max order amount", "What is the highest single amount recorded?"),
    ("total order count", "How many records are there in total?"),
    ("monthly amount trend", "Show the total amount grouped by month"),
    ("filtered region", "Total amount for the West region only"),
]


def main():
    token = _auth()
    dataset_id = _dataset(token)
    _ready(token, dataset_id)

    passed = 0
    results = []
    for name, q in QUESTIONS:
        ok, detail, status, sql = _ask(token, dataset_id, q)
        if ok:
            passed += 1
        results.append((name, ok, detail, status, sql))
        print(f"[{'PASS' if ok else 'FAIL'}] {name} ({status})")

    print(f"\n=== EVAL RESULT: {passed}/{len(QUESTIONS)} passed ===")
    for name, ok, detail, status, sql in results:
        if not ok:
            print(f"\n--- {name} ---\n  status: {status}\n  detail: {detail}\n  sql: {sql[:500]}")
    return 0 if passed == len(QUESTIONS) else 1


def _auth():
    if EMAIL and PASSWORD:
        r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
        if r.status_code != 200:
            print(f"Login failed for EVAL_EMAIL: {r.status_code} {r.text}")
            sys.exit(2)
        return r.json()["access_token"]

    email = f"eval_{uuid.uuid4().hex[:8]}@example.com"
    password = "EvalPass123!"
    r = requests.post(f"{BASE}/auth/register", json={"email": email, "password": password}, timeout=30)
    if r.status_code != 200:
        print(f"Register failed: {r.status_code} {r.text}")
        sys.exit(2)
    print(f"[info] using fresh account {email}")
    return r.json()["access_token"]


def _dataset(token):
    if DATASET_ID:
        return DATASET_ID
    with open(FIXTURE, "rb") as f:
        r = requests.post(f"{BASE}/datasets/upload", headers={"Authorization": f"Bearer {token}"},
                          files={"file": ("sample_sales.csv", f, "text/csv")}, timeout=60)
    if r.status_code not in (200, 201):
        print(f"Fixture upload failed: {r.status_code} {r.text}")
        sys.exit(2)
    return r.json()["dataset_id"]


def _ready(token, dataset_id):
    r = requests.get(f"{BASE}/warehouse/{dataset_id}", headers={"Authorization": f"Bearer {token}"}, timeout=30)
    if r.status_code == 200:
        return
    r = requests.post(f"{BASE}/warehouse/{dataset_id}/generate",
                      headers={"Authorization": f"Bearer {token}"}, timeout=120)
    if r.status_code != 200:
        print(f"Warehouse generation failed: {r.status_code} {r.text}")
        sys.exit(2)


def _ask(token, dataset_id, question):
    r = requests.post(f"{BASE}/ai/{dataset_id}/query",
                      headers={"Authorization": f"Bearer {token}"},
                      json={"question": question}, timeout=200)
    status = r.status_code
    if status != 200:
        detail = ""
        try:
            detail = r.json().get("detail", "")
        except Exception:
            detail = r.text[:200]
        return False, detail, status, ""

    body = r.json()
    sql = body.get("generated_sql", "")
    result = body.get("result")
    ok = sql.lstrip().lower().startswith("select") and isinstance(result, list)
    detail = f"{len(result)} rows" if ok else f"unexpected payload: {body}"
    return ok, detail, status, sql


if __name__ == "__main__":
    sys.exit(main())