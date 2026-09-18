import pandas as pd
from sqlalchemy import create_engine
import re


def build_fact_table_name(dataset_name: str, dataset_id: str | None = None) -> str:
    """Build a unique, DB-safe fact table name.

    Derived from the dataset filename (so humans can read it), with the first
    bytes of the dataset UUID appended so datasets with identical names never
    collide or clobber each other's tables.
    """
    slug = re.sub(r"\W+", "_", dataset_name.lower())
    slug = re.sub(r"^_+|_+$", "", slug)[:40]
    suffix = dataset_id[:8] if dataset_id else "d"
    return f"fact_{slug}_{suffix}"


def generate_star_schema(df: pd.DataFrame, dataset_name: str, dataset_id: str | None = None) -> dict:
    measures = []
    dimensions = []
    data_dictionary = []

    for col in df.columns:
        dtype = str(df[col].dtype)
        unique_count = df[col].nunique()
        null_count = int(df[col].isnull().sum())

        # Numeric columns with more than one distinct value are measures.
        # (A <=10 unique-value threshold silently zeroed out measures on small
        #  or sample datasets, which broke the analytics/AI SQL generation.)
        if dtype in ["int64", "float64", "Int64", "Float64"] and unique_count > 1:
            measures.append({
                "column": col,
                "type": dtype,
                "aggregation": "SUM"
            })
            role = "measure"

        # Everything else (categorical, constant, dates) → dimension
        else:
            dim_table_name = f"dim_{col.lower().replace(' ', '_')}"
            dimensions.append({
                "column": col,
                "dimension_table": dim_table_name,
                "distinct_values": int(unique_count)
            })
            role = "dimension"

        data_dictionary.append({
            "column": col,
            "data_type": dtype,
            "role": role,
            "null_count": null_count,
            "distinct_values": int(unique_count)
        })

    fact_table_name = build_fact_table_name(dataset_name, dataset_id)

    return {
        "fact_table_name": fact_table_name,
        "measures": measures,
        "dimensions": dimensions,
        "data_dictionary": data_dictionary
    }

def load_data_to_sql(df: pd.DataFrame, table_name: str, engine):
    df.to_sql(table_name, engine, if_exists="replace", index=False)