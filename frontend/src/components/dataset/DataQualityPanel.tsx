"use client";

import { useCallback, useState } from "react";
import { Activity, GitBranch, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { runProfiling } from "@/lib/api/profiling";
import { FullProfile } from "@/types/profile";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/utils/cn";

function healthColor(score: number) {
  if (score >= 80) return { variant: "positive" as const, label: "Good" };
  if (score >= 60) return { variant: "signal" as const, label: "Fair" };
  return { variant: "negative" as const, label: "Poor" };
}

export default function DataQualityPanel({ datasetId }: { datasetId: string }) {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await runProfiling(datasetId);
      setProfile(result);
      showToast(`Quality score ${result.health_score}/100`, "success");
    } catch {
      setError(true);
      showToast("Analysis failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [datasetId, showToast]);

  const missingEntries = profile ? Object.entries(profile.missing_values).filter(([, v]) => v > 0) : [];
  const corrColumns = profile ? Object.keys(profile.correlation) : [];

  if (loading && !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-surface-raised p-4 border border-border">
            <Sparkles className="h-6 w-6 text-signal" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">Run data quality analysis</p>
            <p className="text-sm text-text-muted max-w-sm">
              Profile this dataset to compute its health score, missing values, duplicates,
              outliers, and column correlations.
            </p>
          </div>
          {error && <p className="text-sm text-negative">Analysis failed. Please try again.</p>}
          <Button onClick={analyze} loading={loading}>
            <Activity className="h-4 w-4" />
            Analyze data quality
          </Button>
        </CardContent>
      </Card>
    );
  }

  const health = healthColor(profile.health_score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          Last analyzed · refreshed view
        </p>
        <Button variant="secondary" size="sm" onClick={analyze} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          Re-run
        </Button>
      </div>

      {error && (
        <p className="text-sm text-negative bg-negative/10 border border-negative/30 rounded-[var(--radius-sm)] px-3 py-2">
          Refresh failed. Showing last result.
        </p>
      )}

      {/* Health overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted uppercase tracking-wide">Health Score</p>
              <Badge variant={health.variant}>{health.label}</Badge>
            </div>
            <p className="font-data text-3xl font-semibold text-text-primary mt-2">
              {profile.health_score}
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-surface-raised overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  health.variant === "positive"
                    ? "bg-positive"
                    : health.variant === "signal"
                    ? "bg-signal"
                    : "bg-negative"
                )}
                style={{ width: `${profile.health_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs text-text-muted uppercase tracking-wide">Missing Values</p>
            <p className="font-data text-3xl font-semibold text-text-primary mt-2">
              {profile.missing_pct}%
            </p>
            <p className="text-xs text-text-muted mt-2 font-data">
              {missingEntries.reduce((s, [, v]) => s + v, 0)} cells across {missingEntries.length}{" "}
              columns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs text-text-muted uppercase tracking-wide">Duplicates</p>
            <p className="font-data text-3xl font-semibold text-text-primary mt-2">
              {profile.duplicate_pct}%
            </p>
            <p className="text-xs text-text-muted mt-2 font-data">
              {profile.duplicate_rows} duplicate rows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-xs text-text-muted uppercase tracking-wide">Outliers</p>
            <p className="font-data text-3xl font-semibold text-text-primary mt-2">
              {profile.outlier_count}
            </p>
            <p className="text-xs text-text-muted mt-2">Detected via IQR method</p>
          </CardContent>
        </Card>
      </div>

      {/* Missing values breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Missing Values by Column</CardTitle>
          {missingEntries.length === 0 && (
            <Badge variant="positive">No missing values</Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {missingEntries.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              No columns contain missing values.
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {missingEntries.slice(0, 10).map(([col, count]) => {
                const pct = Math.round((count / profile.rows) * 100);
                return (
                  <div key={col} className="flex items-center gap-3">
                    <span className="w-40 truncate text-sm text-text-primary font-medium">{col}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
                      <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-text-muted font-data w-20 text-right">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correlation matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Correlation Matrix</CardTitle>
          <Badge variant="info">
            <GitBranch className="h-3 w-3 mr-1" />Numeric columns
          </Badge>
        </CardHeader>
        {corrColumns.length === 0 ? (
          <CardContent className="text-sm text-text-muted">
            No numeric columns available for correlation analysis.
          </CardContent>
        ) : (
          <CardContent className="overflow-x-auto">
            <table className="text-xs font-data">
              <thead>
                <tr>
                  <th className="text-left pr-3 py-1 text-text-muted"></th>
                  {corrColumns.map((c) => (
                    <th key={c} className="px-2 py-1 text-text-muted">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrColumns.map((row) => (
                  <tr key={row}>
                    <td className="pr-3 py-1 font-medium text-text-secondary">{row}</td>
                    {corrColumns.map((col) => {
                      const v = profile.correlation[row]?.[col];
                      const isNull = v === null || v === undefined || Number.isNaN(v);
                      const abs = isNull ? 0 : Math.abs(v);
                      const cellColor =
                        isNull || v === 0
                          ? "bg-transparent text-text-muted"
                          : v > 0
                          ? `bg-positive/40 text-positive`
                          : `bg-negative/40 text-negative`;
                      return (
                        <td
                          key={col}
                          className={cn(
                            "text-center px-2 py-1 rounded",
                            cellColor,
                            abs > 0.7 && "bg-opacity-70"
                          )}
                        >
                          {isNull ? "—" : v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
