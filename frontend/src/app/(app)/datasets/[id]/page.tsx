"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Rows3,
  Columns3,
  Activity,
  Wand2,
  Boxes,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { getDatasetPreview } from "@/lib/api/datasets";
import { DatasetPreview } from "@/types/dataset";
import PreviewPanel from "@/components/dataset/PreviewPanel";
import DataQualityPanel from "@/components/dataset/DataQualityPanel";
import CleaningPanel from "@/components/dataset/CleaningPanel";
import WarehousePanel from "@/components/dataset/WarehousePanel";
import { cn } from "@/utils/cn";

type Tab = "preview" | "quality" | "cleaning" | "warehouse";

export default function DatasetDetailPage() {
  const params = useParams<{ id: string }>();
  const datasetId = params.id;

  const [meta, setMeta] = useState<DatasetPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("preview");

  const tabs: { key: Tab; label: string; icon: typeof Activity }[] = useMemo(
    () => [
      { key: "preview", label: "Preview", icon: Rows3 },
      { key: "quality", label: "Data Quality", icon: Activity },
      { key: "cleaning", label: "Data Cleaning", icon: Wand2 },
      { key: "warehouse", label: "Warehouse", icon: Boxes },
    ],
    []
  );

  const fetchMeta = useCallback((): Promise<DatasetPreview> => {
    return getDatasetPreview(datasetId, 1, 20);
  }, [datasetId]);

  async function loadMeta() {
    setLoading(true);
    setError(false);
    try {
      setMeta(await fetchMeta());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchMeta()
      .then((result) => {
        if (!cancelled) setMeta(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchMeta]);

  const sourceType = meta ? meta.filename.split(".").pop()?.toUpperCase() : null;

  return (
    <div className="page-shell">
      <div>
        <Link
          href="/datasets"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-signal mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to datasets
        </Link>

        {loading && !meta ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : meta ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="rounded-[var(--radius-sm)] bg-signal/10 border border-signal/20 p-2.5">
                <FileSpreadsheet className="h-5 w-5 text-signal" />
              </div>
              <h1 className="page-title font-data">{meta.filename}</h1>
              <Badge variant="info">
                {sourceType} · {meta.rows.toLocaleString()} rows
              </Badge>
            </div>
            <p className="text-sm text-text-muted pl-11">
              {meta.columns} columns · {meta.total_pages} preview pages
            </p>
          </div>
        ) : (
          <h1 className="page-title">Dataset</h1>
        )}
      </div>

      {/* Stats */}
      {meta && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card interactive>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Rows</p>
                <p className="font-data text-3xl font-semibold text-text-primary mt-1.5 tracking-tight">
                  {meta.rows.toLocaleString()}
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-signal/10 border border-signal/20 p-2.5">
                <Rows3 className="h-5 w-5 text-signal" />
              </div>
            </CardContent>
          </Card>
          <Card interactive>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Columns</p>
                <p className="font-data text-3xl font-semibold text-text-primary mt-1.5 tracking-tight">
                  {meta.columns}
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-positive/10 border border-positive/20 p-2.5">
                <Columns3 className="h-5 w-5 text-positive" />
              </div>
            </CardContent>
          </Card>
          <Card interactive>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Source Type
                </p>
                <p className="font-data text-3xl font-semibold text-text-primary mt-1.5 tracking-tight capitalize">
                  {meta.filename.split(".").pop()}
                </p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-info/10 border border-info/20 p-2.5">
                <ShieldCheck className="h-5 w-5 text-info" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && <ErrorState message="Unable to load dataset." onRetry={loadMeta} />}

      {!error && (
        <>
          {/* Tabs */}
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

          {tab === "preview" ? (
            <PreviewPanel datasetId={datasetId} />
          ) : tab === "quality" ? (
            <DataQualityPanel datasetId={datasetId} />
          ) : tab === "cleaning" ? (
            <CleaningPanel datasetId={datasetId} />
          ) : (
            <WarehousePanel datasetId={datasetId} />
          )}
        </>
      )}
    </div>
  );
}