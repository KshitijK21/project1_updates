"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Upload, Database, LayoutGrid, Rows3 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { TableSkeleton, DatasetSkeleton } from "@/components/ui/Skeletons";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import DatasetTable from "@/components/datasets/DatasetTable";
import DatasetCard from "@/components/datasets/DatasetCard";
import { listDatasets, deleteDataset } from "@/lib/api/datasets";
import { getDatasetHealth } from "@/lib/api/profiling";
import { useToast } from "@/components/ui/Toast";
import { isAxiosError } from "axios";
import { DatasetWithHealth } from "@/components/datasets/datasetHealth";
import { cn } from "@/utils/cn";

type ViewMode = "table" | "grid";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; filename: string } | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function fetchDatasets(): Promise<DatasetWithHealth[]> {
    const list = await listDatasets();
    return Promise.all(
      list.map(async (d) => {
        const health = await getDatasetHealth(d.dataset_id);
        return { ...d, health_score: health?.health_score ?? null };
      })
    );
  }

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setDatasets(await fetchDatasets());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchDatasets()
      .then((data) => {
        if (!cancelled) setDatasets(data);
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
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return datasets;
    return datasets.filter(
      (d) =>
        d.filename.toLowerCase().includes(q) || d.status.toLowerCase().includes(q)
    );
  }, [datasets, debouncedQuery]);

  async function handleDelete(id: string, filename: string) {
    setDeleting(id);
    setPendingDelete(null);
    try {
      await deleteDataset(id);
      showToast(`"${filename}" deleted`, "success");
      await load();
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        showToast(err.response.data.detail, "error");
      } else {
        showToast("Failed to delete dataset.", "error");
      }
    } finally {
      setDeleting(null);
    }
  }

  const hasDatasets = datasets.length > 0;
  const showEmptySearch = hasDatasets && filtered.length === 0;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Datasets</h1>
          <p className="page-subtitle">
            Manage and explore your data.
          </p>
        </div>
        <Link href="/datasets/upload">
          <Button size="lg">
            <Upload className="h-4 w-4" />
            Upload dataset
          </Button>
        </Link>
      </div>

      {error ? (
        <ErrorState message="Unable to load datasets." onRetry={load} />
      ) : (
        <>
          {/* Toolbar */}
          {hasDatasets && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search datasets…"
                  className="w-full h-10 rounded-[var(--radius-sm)] bg-surface border border-border pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal-dim transition-colors"
                  aria-label="Search datasets"
                />
              </div>
              <div className="flex rounded-[var(--radius-sm)] border border-border overflow-hidden bg-surface">
                {(
                  [
                    { mode: "table" as const, icon: Rows3, label: "Table" },
                    { mode: "grid" as const, icon: LayoutGrid, label: "Grid" },
                  ]
                ).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    aria-label={`${label} view`}
                    aria-pressed={view === mode}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 h-10 text-xs font-medium transition-colors",
                      view === mode
                        ? "bg-signal/15 text-signal"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            view === "table" ? (
              <TableSkeleton rows={6} cols={6} />
            ) : (
              <DatasetSkeleton count={6} />
            )
          ) : showEmptySearch ? (
            <EmptyState
              icon={Search}
              title="No matching datasets"
              description={`Nothing found for "${query}". Try a different search.`}
            />
          ) : datasets.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No datasets yet"
              description="Upload your first dataset to begin analyzing your data."
              action={
                <Link href="/datasets/upload">
                  <Button size="sm">
                    <Upload className="h-4 w-4" />
                    Upload dataset
                  </Button>
                </Link>
              }
            />
          ) : view === "table" ? (
            <DatasetTable
              datasets={filtered}
              deleting={deleting}
              onDelete={(id) => {
                const d = datasets.find((x) => x.dataset_id === id);
                if (d) setPendingDelete({ id: d.dataset_id, filename: d.filename });
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((d) => (
                <DatasetCard
                  key={d.dataset_id}
                  dataset={d}
                  deleting={deleting === d.dataset_id}
                  onDelete={() => setPendingDelete({ id: d.dataset_id, filename: d.filename })}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete Dataset"
        size="sm"
      >
        <p className="text-sm text-text-muted">
          Are you sure you want to delete{" "}
          <span className="text-text-primary font-medium">{pendingDelete?.filename}</span>?
          This removes the warehouse, profiling data, and reports. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={!!deleting}
            onClick={() => pendingDelete && handleDelete(pendingDelete.id, pendingDelete.filename)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}