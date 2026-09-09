"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronsRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/datasets/upload")) return "Upload Dataset";
  if (pathname.match(/^\/datasets\/[^/]+$/)) return "Dataset";
  if (pathname.startsWith("/admin/audit")) return "Audit Log";
  const segment = pathname.split("/").filter(Boolean)[0];
  const map: Record<string, string> = {
    dashboard: "Overview",
    datasets: "Datasets",
    analytics: "Analytics",
    insights: "Insights",
    forecasts: "Forecasts",
    reports: "Reports",
  };
  return map[segment] ?? "Overview";
}

function initials(email: string | null): string {
  if (!email) return "U";
  return email.slice(0, 2).toUpperCase();
}

export default function Header({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { email, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const title = getPageTitle(pathname);

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-text-secondary hover:text-text-primary p-1.5 -ml-1.5 rounded-md hover:bg-surface-raised transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden lg:flex items-center text-text-muted">
            <ChevronsRight className="h-4 w-4" />
          </span>
          <h2 className="font-display font-medium text-sm text-text-secondary truncate">
            {title}
          </h2>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="h-8 w-8 rounded-full bg-signal/10 border border-signal/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-signal">{initials(email)}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm text-text-primary leading-none">{email || "User"}</p>
            <p className="text-xs text-text-muted capitalize mt-1">{role || "user"}</p>
          </div>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-[var(--radius-md)] border border-border-strong bg-surface-raised shadow-[var(--shadow-lg)] py-1.5 z-30 animate-in zoom-in-95 fade-in duration-100"
          >
            <div className="px-4 py-2.5 border-b border-border mb-1">
              <p className="text-sm text-text-primary truncate">{email || "User"}</p>
              <p className="text-xs text-text-muted capitalize mt-0.5">
                {role === "admin" ? "Administrator" : "Member"}
              </p>
            </div>
            <button
              role="menuitem"
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-negative hover:bg-negative/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}