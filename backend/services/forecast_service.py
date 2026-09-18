import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression


def forecast_measure(df: pd.DataFrame, date_col: str, measure_col: str, periods: int = 7) -> dict:
    data = df[[date_col, measure_col]].dropna().copy()
    # Parse dates with ISO/US ordering first; fall back to dayfirst for
    # dd/mm/yyyy files, so no valid rows are dropped to NaT.
    data[date_col] = pd.to_datetime(data[date_col], errors="coerce")
    parsed = data[date_col].notna().sum()
    if parsed < 3:
        data[date_col] = pd.to_datetime(data[date_col], dayfirst=True, errors="coerce")
    data = data.dropna().sort_values(date_col)

    if len(data) < 3:
        raise ValueError("Not enough data points to forecast (need at least 3)")

    data["day_index"] = (data[date_col] - data[date_col].min()).dt.days
    X = data[["day_index"]].values
    y = data[measure_col].values

    model = LinearRegression()
    model.fit(X, y)

    last_day = data["day_index"].max()
    future_days = np.array([[last_day + i] for i in range(1, periods + 1)])
    predictions = model.predict(future_days)

    last_date = data[date_col].max()
    future_dates = [(last_date + pd.Timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, periods + 1)]

    historical = [
        {"date": d.strftime("%Y-%m-%d"), "value": float(v)}
        for d, v in zip(data[date_col], data[measure_col])
    ]
    forecast = [
        {"date": d, "predicted_value": round(float(p), 2)}
        for d, p in zip(future_dates, predictions)
    ]

    trend = "increasing" if model.coef_[0] > 0 else "decreasing" if model.coef_[0] < 0 else "flat"

    return {
        "measure": measure_col,
        "trend": trend,
        "historical": historical,
        "forecast": forecast
    }