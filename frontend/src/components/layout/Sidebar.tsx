"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronsLeft } from "lucide-react";
import { navGroups } from "@/lib/nav-config";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { role } = useAuth();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || role === "admin"),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 h-full shrink-0 border-r border-border bg-surface",
          "flex flex-col transition-all duration-200 ease-out lg:translate-x-0",
          collapsed ? "lg:w-[68px]" : "lg:w-64",
          mobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        )}
        aria-label="Application navigation"
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center gap-2.5 h-16 border-b border-border shrink-0",
            collapsed ? "px-4 justify-center" : "px-5 justify-between"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 overflow-hidden",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-signal/10 border border-signal/30">
              <Activity className="h-4 w-4 text-signal" />
            </div>
            {!collapsed && (
              <span className="font-display font-semibold text-sm tracking-wide text-text-primary whitespace-nowrap">
                AUTONOMOUS BI
              </span>
            )}
          </div>

          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-all duration-150",
                          collapsed && "justify-center px-2",
                          active
                            ? "bg-signal-soft text-signal font-medium"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                        )}
                      >
                        <Icon
                          className={cn("h-4 w-4 shrink-0", active && "text-signal")}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "px-5 py-4 border-t border-border",
            collapsed && "px-0 text-center"
          )}
        >
          <p className="text-xs text-text-muted font-data">
            {collapsed ? "v1.0" : "v1.0.0 · Platform"}
          </p>
        </div>
      </aside>
    </>
  );
}