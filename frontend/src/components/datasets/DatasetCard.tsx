import Link from "next/link";
import { FileSpreadsheet, Rows3, Columns3, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  DatasetWithHealth,
  healthVariant,
  healthLabel,
  fileType,
  formatNumber,
} from "./datasetHealth";

export default function DatasetCard({
  dataset,
  deleting,
  onDelete,
}: {
  dataset: DatasetWithHealth;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <Card interactive className="overflow-hidden">
      <Link href={`/datasets/${dataset.dataset_id}`} className="block">
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-[var(--radius-sm)] bg-signal/10 border border-signal/20 p-2.5 shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-signal" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {dataset.filename}
                </p>
                <p className="text-xs text-text-muted font-data mt-0.5">
                  {fileType(dataset.filename)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Rows3 className="h-3.5 w-3.5 text-text-muted" />
              <span className="font-data">{formatNumber(dataset.rows)} rows</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Columns3 className="h-3.5 w-3.5 text-text-muted" />
              <span className="font-data">{dataset.columns} cols</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between border-t border-border bg-surface-raised/40 px-5 py-3">
        <Badge variant={healthVariant(dataset.health_score)}>
          {healthLabel(dataset.health_score)}
        </Badge>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-negative disabled:opacity-50 transition-colors"
          title="Delete dataset"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Card>
  );
}