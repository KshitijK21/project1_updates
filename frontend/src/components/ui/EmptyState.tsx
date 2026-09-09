import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-full bg-surface-raised p-4 border border-border shadow-sm">
        <Icon className="h-6 w-6 text-text-muted" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-display font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-sm text-text-muted max-w-xs leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
