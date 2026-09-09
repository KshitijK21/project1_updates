import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export default function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display font-semibold text-sm text-text-primary">
          Quick actions
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 px-5 py-4 hover:bg-surface-raised/50 transition-colors"
            >
              <div className="rounded-[var(--radius-sm)] bg-signal/10 border border-signal/20 p-2.5 shrink-0">
                <Icon className="h-4 w-4 text-signal" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">
                  {action.label}
                </p>
                <p className="text-xs text-text-muted truncate">{action.description}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-muted group-hover:text-signal transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}