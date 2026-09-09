"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Database, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import { ChartCard, LineChart } from "@/components/charts";
import { listDatasets, getDatasetPreview } from "@/lib/api/datasets";
import { getForecast } from "@/lib/api/predictive";
import { ForecastResponse } from "@/types/predictive";
import { ColumnInfo } from "@/types/dataset";

const TREND_STYLES: Record<string, { variant: "positive" | "negative" | "default" }> = {
  increasing: { variant: "positive" },
  decreasing: { variant: "negative" },
  flat: { variant: "default" },
};

export default function ForecastsPage() {
  const [datasets, setDatasets] = useState<{ dataset_id: string; filename: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [measure, setMeasure] = useState("");
  const [periods, setPeriods] = useState(7);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loadingCols, setLoadingCols] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState(false);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await listDatasets();
        setDatasets(list);
      } catch {
        setError(true);
      }
    })();
  }, []);

  const numericCols = useMemo(
    () => columns.filter((c) => c.dtype?.includes("int") || c.dtype?.includes("float")),
    [columns]
  );

  async function selectDataset(id: string) {
    setSelectedId(id);
    setLoadingCols(true);
    setError(false);
    setNoData(false);
    setForecast(null);
    try {
      const preview = await getDatasetPreview(id, 1, 1);
      setColumns(preview.column_info);
      const date =
        preview.column_info.find((c) => c.dtype?.includes("datetime") || c.dtype === "object")
          ?.name ?? preview.column_info[0]?.name;
      const numeric = preview.column_info.find(
        (c) => c.dtype?.includes("int") || c.dtype?.includes("float")
      )?.name;
      if (date) setDateCol(date);
      if (numeric) setMeasure(numeric);
      setNoData(preview.column_info.length === 0);
    } catch {
      setNoData(true);
    } finally {
      setLoadingCols(false);
    }
  }

  async function runForecast() {
    if (!selectedId || !dateCol || !measure) return;
    setLoadingForecast(true);
    setError(false);
    try {
      const res = await getForecast(selectedId, dateCol, measure, periods);
      setForecast(res);
    } catch {
      setError(true);
    } finally {
      setLoadingForecast(false);
    }
  }

  const chartData = useMemo(() => {
    if (!forecast) return [];
    const histByDate = new Map(forecast.historical.map((h) => [h.date, h.value]));
    const fcByDate = new Map(forecast.forecast.map((f) => [f.date, f.predicted_value]));
    const allDates = Array.from(
      new Set([
        ...forecast.historical.map((h) => h.date),
        ...forecast.forecast.map((f) => f.date),
      ])
    ).sort();
    return allDates.map((date) => ({
      date,
      actual: histByDate.has(date) ? histByDate.get(date)! : null,
      forecast: fcByDate.has(date) ? fcByDate.get(date)! : null,
    }));
  }, [forecast]);

  if (error) {
    return (
      <div className="page-shell">
        <ErrorState message="Unable to load forecast." onRetry={runForecast} />
      </div>
    );
  }

  const trendStyle = forecast
    ? TREND_STYLES[forecast.trend] ?? { variant: "default" as const }
    : null;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Forecasts</h1>
          <p className="page-subtitle">
            Predict future trends from your time series data using linear regression.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Select
              label="Dataset"
              value={selectedId}
              onChange={(e) => selectDataset(e.target.value)}
              options={datasets.map((d) => ({ value: d.dataset_id, label: d.filename }))}
            />
            <Select
              label="Date Column"
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              options={columns.map((c) => ({ value: c.name, label: c.name }))}
            />
            <Select
              label="Measure"
              value={measure}
              onChange={(e) => setMeasure(e.target.value)}
              options={numericCols.map((c) => ({ value: c.name, label: c.name }))}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Periods
              </label>
              <div className="relative">
                <select
                  value={periods}
                  onChange={(e) => setPeriods(Number(e.target.value))}
                  className="w-full h-10 rounded-[var(--radius-sm)] bg-surface border border-border px-3 pr-9 text-sm text-text-primary appearance-none focus:outline-none focus:ring-2 focus:ring-signal/40 cursor-pointer transition-colors"
                >
                  {[3, 7, 14, 30].map((p) => (
                    <option key={p} value={p}>
                      {p} days
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={runForecast}
              disabled={!selectedId || !dateCol || !measure}
              loading={loadingForecast}
            >
              {!loadingForecast && <TrendingUp className="h-4 w-4" />}
              Generate forecast
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadingCols && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {!loadingCols && noData && (
        <EmptyState
          icon={Database}
          title="No data"
          description="This dataset has no columns to forecast against."
        />
      )}

      {forecast && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={(trendStyle?.variant ?? "default") as "positive" | "negative" | "default"}>
              Trend: {forecast.trend}
            </Badge>
            <span className="text-xs text-text-muted font-data">
              {forecast.historical.length} historical · {forecast.forecast.length} forecast points
            </span>
          </div>

          <ChartCard
            title={`${forecast.measure} — Forecast`}
            subtitle="Historical (amber) vs predicted (green)"
            empty={chartData.length === 0}
          >
            <LineChart
              data={chartData}
              xKey="date"
              series={[
                { dataKey: "actual", name: "Historical", color: "#e9a23b" },
                { dataKey: "forecast", name: "Forecast", color: "#34c98e" },
              ]}
              height={320}
            />
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Values</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto rounded-b-[var(--radius-md)] border-t border-border">
                  <table className="w-full text-xs font-data">
                    <thead className="bg-surface-raised">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-text-muted">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-text-muted">
                          Predicted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {forecast.forecast.map((f, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-text-primary">{f.date}</td>
                          <td className="px-3 py-2 text-positive">
                            {f.predicted_value?.toLocaleString() ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Historical</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto rounded-b-[var(--radius-md)] border-t border-border">
                  <table className="w-full text-xs font-data">
                    <thead className="bg-surface-raised">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-text-muted">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-text-muted">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {forecast.historical
                        .slice(-10)
                        .reverse()
                        .map((h, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-text-primary">{h.date}</td>
                            <td className="px-3 py-2 text-text-primary">{h.value.toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}