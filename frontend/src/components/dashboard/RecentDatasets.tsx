import Link from "next/link";
import { Database, ArrowRight, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Dataset } from "@/types/dataset";

interface DatasetWithHealth extends Dataset {
  health_score: number | null;
}

function healthVariant(score: number | null): "positive" | "signal" | "negative" | "default" {
  if (score === null) return "default";
  if (score >= 80) return "positive";
  if (score >= 60) return "signal";
  return "negative";
}

export default function RecentDatasets({
  datasets,
  loading,
}: {
  datasets: DatasetWithHealth[];
  loading: boolean;
}) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm text-text-primary">
            Recent datasets
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Latest uploads across your workspace
          </p>
        </div>
        <Link
          href="/datasets"
          className="text-xs text-signal hover:underline flex items-center gap-1 font-medium"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="animate-pulse rounded-md bg-surface-raised h-4 w-40" />
              <div className="animate-pulse rounded-md bg-surface-raised h-3 w-24 mt-2" />
            </div>
          ))
        ) : datasets.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 rounded-full bg-surface-raised p-4 border border-border w-fit">
              <Database className="h-6 w-6 text-text-muted" />
            </div>
            <p className="text-base font-display font-semibold text-text-primary">
              No datasets yet
            </p>
            <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
              Upload your first dataset to begin analyzing your data.
            </p>
          </div>
        ) : (
          datasets.map((d) => (
            <Link
              key={d.dataset_id}
              href={`/datasets/${d.dataset_id}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-raised/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-[var(--radius-sm)] bg-surface-raised border border-border p-2 shrink-0">
                  <FileSpreadsheet className="h-4 w-4 text-text-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">
                    {d.filename}
                  </p>
                  <p className="text-xs text-text-muted font-data mt-0.5">
                    {d.rows.toLocaleString()} rows · {d.columns} columns
                  </p>
                </div>
              </div>
              <Badge variant={healthVariant(d.health_score)}>
                {d.health_score !== null ? `Health ${Math.round(d.health_score)}` : "Not profiled"}
              </Badge>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}