import { ReactNode } from "react";
import Skeleton from "./Skeleton";

export function MetricCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-sm">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-4 h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface shadow-sm">
      <div className="flex gap-6 border-b border-border bg-surface-raised/80 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="flex gap-6 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, ci) => (
              <Skeleton
                key={ci}
                className={ci === 0 ? "h-3 w-40" : "h-3 w-20"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-5 h-64 w-full" />
    </div>
  );
}

export function DatasetSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-border bg-surface p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)]" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="page-shell">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      {children}
    </div>
  );
}
