import pandas as pd
import numpy as np


def _iqr_bounds(series: pd.Series):
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    return Q1 - 1.5 * IQR, Q3 + 1.5 * IQR


def generate_cleaning_suggestions(df: pd.DataFrame) -> list:
    suggestions = []

    # Missing values → suggest imputation
    missing = df.isnull().sum()
    for col, count in missing.items():
        if count > 0:
            if df[col].dtype in ["float64", "int64"]:
                method = "fill with mean/median"
            else:
                method = "fill with mode or 'Unknown'"
            suggestions.append({
                "id": f"missing_{col}",
                "column": col,
                "issue": "missing_values",
                "affected_rows": int(count),
                "suggestion": method
            })

    # Duplicates → suggest removal
    duplicate_count = int(df.duplicated().sum())
    if duplicate_count > 0:
        suggestions.append({
            "id": "duplicate_rows",
            "column": None,
            "issue": "duplicate_rows",
            "affected_rows": duplicate_count,
            "suggestion": "remove duplicate rows"
        })

    # Outliers → suggest review (using IQR, same method as profiling)
    numeric_df = df.select_dtypes(include="number")
    for col in numeric_df.columns:
        lower, upper = _iqr_bounds(numeric_df[col])
        outlier_count = int(((numeric_df[col] < lower) | (numeric_df[col] > upper)).sum())
        if outlier_count > 0:
            suggestions.append({
                "id": f"outlier_{col}",
                "column": col,
                "issue": "outliers",
                "affected_rows": outlier_count,
                "suggestion": "review values manually or cap using IQR bounds"
            })

    # Invalid/mixed data types → suggest conversion
    for col in df.columns:
        if df[col].dtype == "object":
            numeric_convertible = pd.to_numeric(df[col], errors="coerce").notnull().sum()
            if numeric_convertible > 0 and numeric_convertible < len(df):
                suggestions.append({
                    "id": f"mixed_{col}",
                    "column": col,
                    "issue": "mixed_data_types",
                    "affected_rows": int(len(df) - numeric_convertible),
                    "suggestion": "standardize column to a single data type"
                })

    return suggestions


def get_available_suggestion_ids(df: pd.DataFrame) -> set:
    return {s["id"] for s in generate_cleaning_suggestions(df)}


def apply_cleaning(df: pd.DataFrame, suggestion_ids: list) -> dict:
    """Apply the selected cleaning operations to a copy of the DataFrame."""
    result = df.copy()
    rows_before = len(result)
    operations = []
    skipped = []
    available = get_available_suggestion_ids(result)

    for sid in suggestion_ids:
        if sid not in available:
            skipped.append(sid)
            continue

        if sid == "duplicate_rows":
            before = len(result)
            result = result.drop_duplicates()
            removed = before - len(result)
            operations.append(f"Removed {removed} duplicate row(s)")
        elif sid.startswith("missing_"):
            col = sid.replace("missing_", "")
            if col in result.columns:
                col_series = result[col]
                fill_value = (
                    col_series.mean()
                    if pd.api.types.is_numeric_dtype(col_series)
                    else (col_series.mode().iloc[0] if not col_series.mode().empty else "Unknown")
                )
                filled = int(col_series.isnull().sum())
                result[col] = col_series.fillna(fill_value)
                operations.append(f"Filled {filled} missing value(s) in '{col}'")
        elif sid.startswith("outlier_"):
            col = sid.replace("outlier_", "")
            if col in result.columns and pd.api.types.is_numeric_dtype(result[col]):
                lower, upper = _iqr_bounds(result[col])
                capped = int(((result[col] < lower) | (result[col] > upper)).sum())
                result[col] = result[col].clip(lower=lower, upper=upper)
                operations.append(f"Capped {capped} outlier(s) in '{col}'")
        elif sid.startswith("mixed_"):
            col = sid.replace("mixed_", "")
            if col in result.columns:
                converted = pd.to_numeric(result[col], errors="coerce")
                result[col] = converted
                operations.append(f"Standardized '{col}' to numeric")

    rows_after = len(result)
    return {
        "dataframe": result,
        "operations": operations,
        "skipped": skipped,
        "rows_before": rows_before,
        "rows_after": rows_after,
    }
