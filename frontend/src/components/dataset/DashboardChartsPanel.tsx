"use client";

import { useEffect, useMemo, useState } from "react";
import { Table2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { BarChart, PieChart, ChartCard, CHART_COLORS } from "@/components/charts";
import { getDashboardSummary, getChartData, getDrilldown } from "@/lib/api/dashboard";
import { Kpi, SummaryChart, DrilldownRow } from "@/types/dashboard";
import { WarehouseData } from "@/types/warehouse";
import { cn } from "@/utils/cn";

const AGGREGATIONS = ["SUM", "AVG", "COUNT", "MIN", "MAX"];

export default function DashboardChartsPanel({
  datasetId,
  warehouse,
}: {
  datasetId: string;
  warehouse: WarehouseData;
}) {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [charts, setCharts] = useState<SummaryChart[]>([]);
  const [dimension, setDimension] = useState(warehouse.dimensions[0]?.column ?? "");
  const [measure, setMeasure] = useState(warehouse.measures[0]?.column ?? "");
  const [aggregation, setAggregation] = useState("SUM");
  const [filteredChart, setFilteredChart] = useState<SummaryChart | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [chartMode, setChartMode] = useState<"bar" | "pie">("bar");
  const [drill, setDrill] = useState<{ dimension: string; value: string; rows: DrilldownRow[] } | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const summary = await getDashboardSummary(datasetId);
        setKpis(summary.kpis);
        setCharts(summary.charts);
        const m = warehouse.measures[0]?.column;
        if (m) {
          const dim = warehouse.dimensions[0]?.column;
          const fc = summary.charts.find((c) => c.measure === m && (!dim || c.dimension === dim));
          setFilteredChart(fc ?? summary.charts[0] ?? null);
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  useEffect(() => {
    if (!dimension || !measure) return;
    (async () => {
      setFilterLoading(true);
      try {
        const res = await getChartData(datasetId, dimension, measure, aggregation);
        setFilteredChart({ dimension: res.dimension, measure: res.measure, data: res.data });
      } catch {
        setFilteredChart(null);
      } finally {
        setFilterLoading(false);
      }
    })();
  }, [datasetId, dimension, measure, aggregation]);

  async function handleDrill() {
    if (!dimension || !filteredChart || filteredChart.data.length === 0) return;
    const top = filteredChart.data[0].label;
    setDrillLoading(true);
    try {
      const res = await getDrilldown(datasetId, dimension, String(top));
      setDrill({ dimension, value: String(top), rows: res.rows });
    } catch {
      setDrill(null);
    } finally {
      setDrillLoading(false);
    }
  }

  const chartData = useMemo(
    () =>
      (filteredChart?.data ?? []).map((d) => ({
        label: String(d.label),
        value: Number(d.value),
      })),
    [filteredChart]
  );

  const pieData = useMemo(
    () => chartData.map((d) => ({ name: d.label, value: d.value })),
    [chartData]
  );

  return (
    <>
      {/* KPI cards */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <Card key={k.measure}>
              <CardContent>
                <p className="text-xs text-text-muted uppercase tracking-wide truncate">{k.measure}</p>
                <p className="font-data text-2xl font-semibold text-text-primary mt-2">
                  {k.total?.toLocaleString() ?? "—"}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
                  <Badge variant="info">Avg {k.average?.toLocaleString() ?? "—"}</Badge>
                  <span>Min {k.minimum?.toLocaleString() ?? "—"}</span>
                  <span>Max {k.maximum?.toLocaleString() ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart controls */}
      {warehouse.dimensions.length > 0 && warehouse.measures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chart Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Dimension"
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                options={warehouse.dimensions.map((d) => ({ value: d.column, label: d.column }))}
              />
              <Select
                label="Measure"
                value={measure}
                onChange={(e) => setMeasure(e.target.value)}
                options={warehouse.measures.map((m) => ({ value: m.column, label: m.column }))}
              />
              <Select
                label="Aggregation"
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                options={AGGREGATIONS.map((a) => ({ value: a, label: a }))}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex rounded-[var(--radius-sm)] border border-border overflow-hidden">
                {(["bar", "pie"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    className={cn(
                      "px-3 py-1.5 text-xs capitalize transition-colors",
                      chartMode === mode ? "bg-signal/15 text-signal" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {mode === "bar" ? "Bar" : "Donut"}
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={handleDrill} loading={drillLoading} disabled={chartData.length === 0}>
                <Table2 className="h-4 w-4" />
                Drill into top value
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <ChartCard
        title={filteredChart ? `${dimension} vs ${measure}` : "Chart"}
        subtitle={measure ? `${aggregation} of ${measure}` : undefined}
        loading={filterLoading}
        empty={chartData.length === 0}
      >
        {chartMode === "bar" ? (
          <BarChart data={chartData} color={CHART_COLORS[0]} />
        ) : (
          <PieChart data={pieData} innerRadius={60} />
        )}
      </ChartCard>

      {/* All dimension charts */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charts.map((c, i) => (
            <ChartCard
              key={`${c.dimension}-${c.measure}`}
              title={`${c.dimension} by ${c.measure}`}
              subtitle={`SUM of ${c.measure}`}
              empty={c.data.length === 0}
            >
              <BarChart
                data={c.data.map((d) => ({ label: String(d.label), value: Number(d.value) }))}
                color={CHART_COLORS[(i + 1) % CHART_COLORS.length]}
              />
            </ChartCard>
          ))}
        </div>
      )}

      {/* Drilldown modal */}
      <Modal
        open={!!drill}
        onClose={() => setDrill(null)}
        title={drill ? `Rows where ${drill.dimension} = ${drill.value}` : ""}
      >
        {drill && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted font-data">{drill.rows.length} row(s)</p>
            {drill.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border">
                <table className="w-full text-xs font-data">
                  <thead className="bg-surface-raised">
                    <tr>
                      {Object.keys(drill.rows[0]).map((k) => (
                        <th key={k} className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-text-muted">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {drill.rows.slice(0, 100).map((row, i) => (
                      <tr key={i}>
                        {Object.keys(row).map((k) => (
                          <td key={k} className="px-3 py-2 text-text-primary">
                            {String(row[k] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No rows found.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
