"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Activity,
  Upload,
  MessageSquareText,
  Columns3,
  FileText,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentDatasets from "@/components/dashboard/RecentDatasets";
import { MetricCardSkeleton } from "@/components/ui/Skeletons";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import { listDatasets } from "@/lib/api/datasets";
import { getDatasetHealth } from "@/lib/api/profiling";
import { useAuth } from "@/hooks/useAuth";
import { Dataset } from "@/types/dataset";

interface DatasetWithHealth extends Dataset {
  health_score: number | null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { email } = useAuth();
  const [datasets, setDatasets] = useState<DatasetWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchDatasets(): Promise<DatasetWithHealth[]> {
    const list = await listDatasets();
    return Promise.all(
      list.map(async (d) => {
        const health = await getDatasetHealth(d.dataset_id);
        return { ...d, health_score: health?.health_score ?? null };
      })
    );
  }

  async function loadData() {
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

  const totalDatasets = datasets.length;
  const scoredDatasets = datasets.filter((d) => d.health_score !== null);
  const avgHealth =
    scoredDatasets.length > 0
      ? Math.round(
          scoredDatasets.reduce((sum, d) => sum + (d.health_score ?? 0), 0) /
            scoredDatasets.length
        )
      : null;
  const totalRows = datasets.reduce((sum, d) => sum + d.rows, 0);
  const totalColumns = datasets.reduce((sum, d) => sum + d.columns, 0);
  const recentDatasets = datasets.slice(0, 5);

  const quickActions = [
    {
      label: "Upload dataset",
      description: "Add a CSV or Excel file",
      href: "/datasets/upload",
      icon: Upload,
    },
    {
      label: "Ask a question",
      description: "Query your data with AI",
      href: "/analytics",
      icon: MessageSquareText,
    },
    {
      label: "View reports",
      description: "Export summaries and decks",
      href: "/reports",
      icon: FileText,
    },
  ];

  return (
    <div className="page-shell">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {getGreeting()}
            {email ? `, ${email.split("@")[0]}` : ""}
          </h1>
          <p className="page-subtitle">
            Here&apos;s what&apos;s happening across your data workspace.
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
        <ErrorState message="Unable to load dashboard data." onRetry={loadData} />
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <MetricCard
                  label="Total datasets"
                  value={totalDatasets}
                  icon={Database}
                  accent="signal"
                  supporting={`${scoredDatasets.length} profiled`}
                />
                <MetricCard
                  label="Avg. data health"
                  value={avgHealth !== null ? `${avgHealth}%` : null}
                  icon={Activity}
                  accent="positive"
                  supporting={avgHealth !== null ? "Across profiled datasets" : "Run profiling to score"}
                />
                <MetricCard
                  label="Total records"
                  value={totalRows.toLocaleString()}
                  icon={Columns3}
                  accent="info"
                  supporting="Across all datasets"
                />
                <MetricCard
                  label="Columns analyzed"
                  value={totalColumns.toLocaleString()}
                  icon={Database}
                  accent="signal"
                  supporting="Combined schema width"
                />
              </>
            )}
          </div>

          {/* Quick actions */}
          <QuickActions actions={quickActions} />

          {/* Recent datasets */}
          <RecentDatasets datasets={recentDatasets} loading={loading} />
        </>
      )}
    </div>
  );
}