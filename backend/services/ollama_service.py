import requests

OLLAMA_URL = "http://localhost:11434"
MODEL = "qwen2.5:3b"


def _generate(prompt: str, max_tokens: int = 500, temperature: float = 0.2) -> str:
    resp = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": max_tokens, "temperature": temperature},
        },
        timeout=180,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


def generate_sql(question: str, table_name: str, columns: list) -> str:
    prompt = f"""You are a SQL expert. Convert the following natural language question into a valid PostgreSQL SELECT query.

Table name: {table_name}
Columns: {', '.join(columns)}

Rules:
- Only generate SELECT statements. Never generate INSERT, UPDATE, DELETE, DROP, or ALTER.
- Always wrap every column name in double quotes exactly as given (e.g. "Sales", "Region"), since PostgreSQL is case-sensitive for mixed-case column names.
- When grouping (GROUP BY), the SELECT list MUST include every grouping column itself (e.g. SELECT "Region", SUM("Sales") FROM ... GROUP BY "Region"), so results are interpretable.
- Return ONLY the raw SQL query, no explanation, no markdown formatting, no backticks.

Question: {question}
SQL:"""
    sql = _generate(prompt, max_tokens=300, temperature=0.1)
    sql = sql.replace("```sql", "").replace("```", "").strip()
    return sql


def explain_result(question: str, result: list) -> str:
    preview = str(result[:10]) if len(result) > 10 else str(result)
    prompt = f"""Explain the following query result in simple, clear natural language for a business user.

Question asked: {question}
Result data: {preview}

Keep it to 2-3 sentences, no technical jargon:"""
    return _generate(prompt, max_tokens=200, temperature=0.3)


def generate_recommendations(profile_data: dict, warehouse_data: dict) -> list:
    prompt = f"""You are a business intelligence analyst. Based on the following data profile and schema, provide 3-5 short, actionable business recommendations.

Data Health: {profile_data}
Schema: {warehouse_data}

Return ONLY the recommendations, one per line, starting each with "- ", with NO preamble, no numbering, no markdown, no code blocks:"""
    text = _generate(prompt, max_tokens=300, temperature=0.5)
    lines = [line.strip("-• ").strip() for line in text.split("\n") if line.strip()]
    return lines[:5]


def generate_executive_summary(profile_data: dict, warehouse_data: dict, kpis: list) -> str:
    prompt = f"""Write a concise executive summary (3-4 sentences) for a business dashboard, based on:

Data Health Score: {profile_data.get('health_score')}
Key Measures: {[k['measure'] for k in kpis]}
KPI values: {kpis}

Keep it professional, non-technical, and suitable for a business stakeholder. Output ONLY the summary text with no preamble:"""
    return _generate(prompt, max_tokens=300, temperature=0.4)