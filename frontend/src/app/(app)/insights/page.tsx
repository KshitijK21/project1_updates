"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertTriangle, Database, Hammer } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { listDatasets } from "@/lib/api/datasets";
import { getWarehouse, generateWarehouse } from "@/lib/api/warehouse";
import { WarehouseData } from "@/types/warehouse";
import DashboardChartsPanel from "@/components/dataset/DashboardChartsPanel";
import AnomalyRootCausePanel from "@/components/dataset/AnomalyRootCausePanel";
import { cn } from "@/utils/cn";

type Tab = "charts" | "anomalies";

export default function InsightsPage() {
  const [datasets, setDatasets] = useState<{ dataset_id: string; filename: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [noWarehouse, setNoWarehouse] = useState(false);
  const [tab, setTab] = useState<Tab>("charts");

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

  async function selectDataset(id: string) {
    setSelectedId(id);
    setLoading(true);
    setError(false);
    setNoWarehouse(false);
    setWarehouse(null);
    setTab("charts");
    try {
      const w = await getWarehouse(id);
      setWarehouse(w);
    } catch {
      setNoWarehouse(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(false);
    try {
      await generateWarehouse(selectedId);
      const w = await getWarehouse(selectedId);
      setWarehouse(w);
      setNoWarehouse(false);
    } catch {
      setError(true);
    } finally {
      setGenerating(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: "charts", label: "Charts", icon: BarChart3 },
    { key: "anomalies", label: "Anomalies & Root Cause", icon: AlertTriangle },
  ];

  if (error) {
    return (
      <div className="page-shell">
        <ErrorState message="Unable to load datasets." />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insights</h1>
          <p className="page-subtitle">
            Charts, KPIs, drill-down, anomaly detection, and root cause analysis.
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <Select
          label="Dataset"
          value={selectedId}
          onChange={(e) => selectDataset(e.target.value)}
          options={datasets.map((d) => ({ value: d.dataset_id, label: d.filename }))}
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-64 sm:col-span-3" />
        </div>
      )}

      {!loading && noWarehouse && (
        <EmptyState
          icon={Database}
          title="Warehouse required"
          description="Generate the warehouse for this dataset to unlock charts and anomaly detection."
          action={
            <Button onClick={handleGenerate} loading={generating}>
              {!generating && <Hammer className="h-4 w-4" />}
              Generate warehouse
            </Button>
          }
        />
      )}

      {!loading && !noWarehouse && warehouse && (
        <>
          <div className="flex gap-1 border-b border-border overflow-x-auto">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap",
                  tab === key
                    ? "border-signal text-signal font-medium"
                    : "border-transparent text-text-muted hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {tab === "charts" ? (
            <DashboardChartsPanel datasetId={selectedId} warehouse={warehouse} />
          ) : (
            <AnomalyRootCausePanel datasetId={selectedId} warehouse={warehouse} />
          )}
        </>
      )}
    </div>
  );
}