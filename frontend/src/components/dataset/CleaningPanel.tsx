"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Wand2, Loader2, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/Toast";
import { getCleaningSuggestions, applyCleaning } from "@/lib/api/cleaning";
import { CleaningSuggestion } from "@/types/cleaning";
import { cn } from "@/utils/cn";

const ISSUE_LABELS: Record<string, { label: string; variant: "signal" | "negative" | "info" }> = {
  missing_values: { label: "Missing", variant: "signal" },
  duplicate_rows: { label: "Duplicates", variant: "negative" },
  outliers: { label: "Outliers", variant: "negative" },
  mixed_data_types: { label: "Mixed types", variant: "info" },
};

export default function CleaningPanel({ datasetId }: { datasetId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [suggestions, setSuggestions] = useState<CleaningSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getCleaningSuggestions(datasetId);
      setSuggestions(data.suggestions);
      setSelected(new Set(data.suggestions.map((s) => s.id)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === suggestions.length
        ? new Set()
        : new Set(suggestions.map((s) => s.id))
    );
  }

  async function handleApply() {
    if (selected.size === 0) return;
    setApplying(true);
    try {
      const res = await applyCleaning(datasetId, Array.from(selected));
      showToast(
        `${res.operations_applied.length} cleaning operation(s) applied (${res.rows_removed} row(s) removed)`,
        "success"
      );
      router.refresh();
      await load();
    } catch {
      showToast("Failed to apply cleaning operations.", "error");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Unable to load cleaning suggestions." onRetry={load} />;
  }

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No cleaning needed"
        description="This dataset has no missing values, duplicates, outliers, or mixed-type columns."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-[var(--radius-sm)] bg-signal/10 p-2">
            <Wand2 className="h-4 w-4 text-signal" />
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium">
              {suggestions.length} cleaning suggestion(s)
            </p>
            <p className="text-xs text-text-muted">
              {selected.size} selected · preview & apply changes below
            </p>
          </div>
        </div>
        <Button onClick={handleApply} disabled={selected.size === 0} loading={applying}>
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Apply {selected.size > 0 ? selected.size : ""} change{selected.size === 1 ? "" : "s"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.size === suggestions.length && suggestions.length > 0}
              onChange={toggleAll}
              className="accent-[var(--signal)]"
            />
            <CardTitle>Suggestions</CardTitle>
          </div>
          <Badge variant="signal">{selected.size}/{suggestions.length} selected</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-10">Apply</TableHeaderCell>
                <TableHeaderCell>Column</TableHeaderCell>
                <TableHeaderCell>Issue</TableHeaderCell>
                <TableHeaderCell>Affected Rows</TableHeaderCell>
                <TableHeaderCell>Recommended Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suggestions.map((s) => {
                const issue = ISSUE_LABELS[s.issue] ?? { label: s.issue, variant: "info" as const };
                return (
                  <TableRow
                    key={s.id}
                    className={cn(
                      "cursor-pointer",
                      !selected.has(s.id) && "opacity-50"
                    )}
                    onClick={() => toggle(s.id)}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggle(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-[var(--signal)]"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {s.column ?? <span className="text-text-muted">— (whole table)</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={issue.variant}>{issue.label}</Badge>
                    </TableCell>
                    <TableCell className="font-data">{s.affected_rows.toLocaleString()}</TableCell>
                    <TableCell className="text-text-secondary text-sm">{s.suggestion}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-surface-raised border border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-signal mt-0.5 shrink-0" />
        <p className="text-xs text-text-muted">
          Applied operations modify the uploaded file in place, then regenerate row/column
          counts. Re-run Data Quality after cleaning to see your new health score.
        </p>
      </div>
    </div>
  );
}
