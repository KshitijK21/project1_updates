"use client";

import { useEffect, useState } from "react";
import { FileText, Presentation, Sparkles, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { PageSkeleton } from "@/components/ui/Skeletons";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import { listDatasets } from "@/lib/api/datasets";
import { getRecommendations, getExecutiveSummary, downloadPdf, downloadPpt } from "@/lib/api/report";
import { useToast } from "@/components/ui/Toast";
import { isAxiosError } from "axios";

export default function ReportsPage() {
  const [datasets, setDatasets] = useState<{ dataset_id: string; filename: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [error, setError] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pptBusy, setPptBusy] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const list = await listDatasets();
        setDatasets(list);
      } catch {
        setError(true);
      } finally {
        setLoadingDatasets(false);
      }
    })();
  }, []);

  async function selectDataset(id: string) {
    setSelectedId(id);
    setLoading(true);
    setError(false);
    setRecommendations([]);
    setExecutiveSummary("");
    try {
      const [recs, summary] = await Promise.all([
        getRecommendations(id),
        getExecutiveSummary(id),
      ]);
      setRecommendations(recs.recommendations);
      setExecutiveSummary(summary.executive_summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(fmt: "pdf" | "ppt") {
    if (!selectedId) return;
    const setBusy = fmt === "pdf" ? setPdfBusy : setPptBusy;
    setBusy(true);
    try {
      const blob = fmt === "pdf" ? await downloadPdf(selectedId) : await downloadPpt(selectedId);
      const ext = fmt === "pdf" ? "pdf" : "pptx";
      const filename = `report.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${fmt.toUpperCase()} report downloaded`, "success");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        showToast(fmt === "pdf" ? "PDF not generated yet." : "PPT not generated yet.", "error");
      } else {
        showToast("Download failed. Please try again.", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loadingDatasets) {
    return <PageSkeleton />;
  }

  if (error && !loading) {
    return (
      <div className="page-shell">
        <ErrorState message="Unable to load report data." />
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={FileText}
          title="No datasets available"
          description="Upload a dataset and run profiling + warehouse to generate reports."
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report</h1>
          <p className="page-subtitle">
            Executive summary, recommendations, and exportable reports.
          </p>
        </div>
        {selectedId && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleDownload("pdf")}
              loading={pdfBusy}
              disabled={loading || pdfBusy}
            >
              {!pdfBusy && <FileText className="h-4 w-4" />}
              PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDownload("ppt")}
              loading={pptBusy}
              disabled={loading || pptBusy}
            >
              {!pptBusy && <Presentation className="h-4 w-4" />}
              PPT
            </Button>
          </div>
        )}
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
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-16 w-full" />
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-16 w-full" />
          </div>
        </div>
      )}

      {!loading && selectedId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-signal" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executiveSummary ? (
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                  {executiveSummary}
                </p>
              ) : (
                <p className="text-sm text-text-muted italic">No summary generated.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-signal" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-signal flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-muted italic">No recommendations generated.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && !selectedId && (
        <EmptyState
          icon={FileText}
          title="Select a dataset"
          description="Choose a dataset above to view its report."
        />
      )}
    </div>
  );
}