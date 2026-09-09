import { Activity } from "lucide-react";

export default function BrandSplash({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-5 bg-bg"
    >
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-signal/10 border border-signal/30 shadow-[var(--shadow-glow)]">
          <Activity className="h-7 w-7 text-signal animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="font-display font-semibold text-base text-text-primary tracking-tight">
          Autonomous BI
        </p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}