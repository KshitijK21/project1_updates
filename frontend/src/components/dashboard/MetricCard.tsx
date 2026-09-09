import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/utils/cn";

interface MetricCardProps {
  label: string;
  value: string | number | null;
  icon: LucideIcon;
  accent?: "signal" | "positive" | "info" | "negative";
  supporting?: string;
  loading?: boolean;
}

const accentStyles: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  signal: "bg-signal/10 text-signal border border-signal/20 shadow-sm shadow-signal/5",
  positive: "bg-positive/10 text-positive border border-positive/20",
  info: "bg-info/10 text-info border border-info/20",
  negative: "bg-negative/10 text-negative border border-negative/20",
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "signal",
  supporting,
  loading,
}: MetricCardProps) {
  return (
    <Card interactive>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted truncate">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-9 w-20 mt-2" />
            ) : (
              <p className="font-data text-3xl font-semibold text-text-primary mt-1.5 tracking-tight">
                {value ?? "—"}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-[var(--radius-sm)] p-2.5 shrink-0",
              accentStyles[accent]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        {supporting && (
          <p className="text-xs text-text-muted mt-3">{supporting}</p>
        )}
      </CardContent>
    </Card>
  );
}