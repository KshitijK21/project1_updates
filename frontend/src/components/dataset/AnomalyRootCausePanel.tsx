"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { PieChart, ChartCard } from "@/components/charts";
import { getAnomalies, getRootCause } from "@/lib/api/predictive";
import { AnomalyResponse, RootCauseResponse } from "@/types/predictive";
import { WarehouseData } from "@/types/warehouse";

export default function AnomalyRootCausePanel({
  warehouse,
  datasetId,
}: {
  warehouse: WarehouseData;
  datasetId: string;
}) {
  const [measure, setMeasure] = useState(warehouse.measures[0]?.column ?? "");
  const [dimension, setDimension] = useState(warehouse.dimensions[0]?.column ?? "");
  const [threshold, setThreshold] = useState(2.0);

  const [anomalies, setAnomalies] = useState<AnomalyResponse | null>(null);
  const [rootCause, setRootCause] = useState<RootCauseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function analyze() {
    if (!datasetId || !measure || !dimension) return;
    setLoading(true);
    setError(false);
    try {
      const [a, r] = await Promise.all([
        getAnomalies(datasetId, measure, threshold),
        getRootCause(datasetId, dimension, measure),
      ]);
      setAnomalies(a);
      setRootCause(r);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (warehouse.measures[0]) setMeasure(warehouse.measures[0].column);
    if (warehouse.dimensions[0]) setDimension(warehouse.dimensions[0].column);
  }, [warehouse]);

  const pieData = useMemo(
    () =>
      (rootCause?.breakdown ?? []).slice(0, 8).map((b) => ({
        name: String(b.dimension_value),
        value: b.total,
      })),
    [rootCause]
  );

  const anomalyColumns = anomalies && anomalies.anomalies.length > 0 ? Object.keys(anomalies.anomalies[0]).filter((k) => k !== "z_score" && k !== "value") : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <Select
              label="Measure"
              value={measure}
              onChange={(e) => setMeasure(e.target.value)}
              options={warehouse.measures.map((m) => ({ value: m.column, label: m.column }))}
            />
            <Select
              label="Dimension (Root Cause)"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              options={warehouse.dimensions.map((d) => ({ value: d.column, label: d.column }))}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Z-Score Threshold</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-10 px-3 text-sm rounded-[var(--radius-sm)] bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-signal/40"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={analyze} loading={loading} disabled={!measure || !dimension}>
              <AlertTriangle className="h-4 w-4" />
              Run analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && <ErrorState message="Analysis failed. Please try again." onRetry={analyze} />}

      {!loading && !error && anomalies && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Anomalies</CardTitle>
              <Badge variant={anomalies.anomaly_count > 0 ? "negative" : "positive"}>
                {anomalies.anomaly_count} detected
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {anomalies.anomaly_count === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">
                  No anomalies detected for this measure at the given threshold.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>#</TableHeaderCell>
                        <TableHeaderCell>Value</TableHeaderCell>
                        <TableHeaderCell>Z-Score</TableHeaderCell>
                        {anomalyColumns.map((col) => (
                          <TableHeaderCell key={col} className="max-w-[160px] truncate">{col}</TableHeaderCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {anomalies.anomalies.slice(0, 50).map((a, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-data text-text-muted">{i + 1}</TableCell>
                          <TableCell className="font-data text-negative">{a.value}</TableCell>
                          <TableCell className="font-data">{a.z_score}</TableCell>
                          {anomalyColumns.map((col) => (
                            <TableCell key={col} className="max-w-[160px] truncate font-data text-xs">
                              {String(a[col] ?? "—")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {rootCause && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Contributor Breakdown"
                subtitle={`${dimension} by total ${measure}`}
                empty={pieData.length === 0}
              >
                <PieChart data={pieData} innerRadius={50} />
              </ChartCard>

              <ChartCard
                title="Top Contributors"
                subtitle={`${measure} grouped by ${dimension}`}
                empty={(rootCause.breakdown ?? []).length === 0}
              >
                <div className="space-y-3">
                  {(rootCause.breakdown ?? []).slice(0, 10).map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: `hsl(${(i * 47) % 360} 70% 60%)` }} />
                      <span className="w-40 truncate text-sm text-text-primary font-medium">{b.dimension_value}</span>
                      <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${b.contribution_pct}%`, background: `hsl(${(i * 47) % 360} 70% 60%)` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted font-data w-16 text-right">{b.contribution_pct}%</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          )}
        </>
      )}

      {!loading && !error && !anomalies && (
        <EmptyState
          icon={AlertTriangle}
          title="No analysis yet"
          description="Configure the measure and dimension above, then run the analysis."
        />
      )}
    </div>
  );
}
