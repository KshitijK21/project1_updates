import {
  LayoutDashboard,
  Database,
  MessageSquareText,
  TrendingUp,
  BarChart3,
  FileText,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Datasets", href: "/datasets", icon: Database },
      { label: "Analytics", href: "/analytics", icon: MessageSquareText },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Insights", href: "/insights", icon: BarChart3 },
      { label: "Forecasts", href: "/forecasts", icon: TrendingUp },
    ],
  },
  {
    label: "Reporting",
    items: [{ label: "Reports", href: "/reports", icon: FileText }],
  },
  {
    label: "Administration",
    items: [
      { label: "Audit Log", href: "/admin/audit", icon: ShieldAlert, adminOnly: true },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);