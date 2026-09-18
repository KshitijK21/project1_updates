"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Database,
  FileText,
  MessageSquareText,
  ScanSearch,
  Sparkles,
  Table2,
  Upload,
  Wand2,
} from "lucide-react";
import { navGroups } from "@/lib/nav-config";
import Button from "@/components/ui/Button";

const capabilities = navGroups
  .flatMap((g) => g.items)
  .map((item) => {
    const map: Record<string, { tagline: string; points: string[] }> = {
      Overview: {
        tagline: "The control room for your entire data pipeline.",
        points: [
          "See the whole platform at a glance",
          "Jump straight into any workspace",
        ],
      },
      Datasets: {
        tagline: "Your data, organized and ready for analysis.",
        points: [
          "Upload CSV or Excel files with drag & drop",
          "Search, browse and delete datasets",
          "Preview rows and inspect every column",
        ],
      },
      Analytics: {
        tagline: "Ask your data anything in plain English.",
        points: [
          "Natural-language questions to your data",
          "AI writes and runs SQL automatically",
          "Cleartext explanations of every result",
        ],
      },
      Insights: {
        tagline: "Know exactly how healthy your data is.",
        points: [
          "Automatic data-quality assessments",
          "Severity-scored issues and recommendations",
          "Resolve problems with one-click cleaning",
        ],
      },
      Forecasts: {
        tagline: "Predict the future of your metrics.",
        points: [
          "Time-series forecasting for any measure",
          "Trend and anomaly detection",
          "Plain-language root-cause explanations",
        ],
      },
      Reports: {
        tagline: "Turn analysis into shareable documents.",
        points: [
          "Executive summaries written for stakeholders",
          "One-click PDF and PowerPoint export",
          "Professional, ready-to-send output",
        ],
      },
      "Audit Log": {
        tagline: "Complete transparency across the platform.",
        points: [
          "Every action recorded with actor and timestamp",
          "Full compliance trail for administrators",
        ],
      },
    };
    const meta = map[item.label] ?? {
      tagline: `Explore the ${item.label} workspace.`,
      points: ["Open the workspace to get started"],
    };
    return { ...item, tagline: meta.tagline, points: meta.points };
  })
  .filter((item) => item.label !== "Overview");

const pipeline = [
  { label: "Upload", href: "/datasets/upload", icon: Upload, text: "Bring in CSV or Excel files" },
  { label: "Profile", href: "/datasets", icon: ScanSearch, text: "Score data quality automatically" },
  { label: "Clean", href: "/datasets", icon: Wand2, text: "Apply AI cleaning suggestions" },
  { label: "Warehouse", href: "/datasets", icon: Table2, text: "Build an analysis-ready schema" },
  { label: "Analyze", href: "/analytics", icon: MessageSquareText, text: "Ask questions in plain English" },
  { label: "Report", href: "/reports", icon: FileText, text: "Export summaries, PDFs and decks" },
];

const quickStarts = [
  { label: "Upload a dataset", href: "/datasets/upload", icon: Upload },
  { label: "Ask AI a question", href: "/analytics", icon: MessageSquareText },
  { label: "Generate a report", href: "/reports", icon: FileText },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-full">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="glow-blob top-[-180px] left-1/2 -translate-x-1/2 h-[420px] w-[720px] bg-signal/25"
          aria-hidden="true"
        />
        <div
          className="glow-blob top-[120px] left-[8%] h-[260px] w-[260px] bg-info/20"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-4 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-signal" aria-hidden="true" />
            Autonomous Business Intelligence Platform
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Your data, understood.
            <br />
            <span className="bg-gradient-to-r from-signal via-[#34d399] to-info bg-clip-text text-transparent">
              Decisions, automated.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-text-secondary sm:text-lg">
            From upload to analysis in minutes. Import your data, let AI profile and
            clean it, then ask questions, forecast trends and export stakeholder-ready
            reports — all from one workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/datasets/upload">
              <Button size="lg">
                <Upload className="h-4 w-4" />
                Upload dataset
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="lg" variant="secondary">
                <MessageSquareText className="h-4 w-4" />
                Ask AI a question
              </Button>
            </Link>
          </div>

          {/* Quick start chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-sm">
            <span className="text-text-muted">Jump in:</span>
            {quickStarts.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-text-secondary transition hover:border-signal/50 hover:text-text-primary hover:bg-surface-raised"
              >
                <q.icon className="h-3.5 w-3.5 text-signal" aria-hidden="true" />
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PIPELINE ===================== */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">
            How it works
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            One pipeline, end to end
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary">
            Every capability on the platform fits into a single flow — each step links
            to the workspace that powers it.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pipeline.map((step, i) => (
            <li key={step.label}>
              <Link
                href={step.href}
                className="card-interactive group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 hover:shadow-glow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-signal/10 border border-signal/25 text-signal">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="font-data text-xs text-text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-display font-semibold text-text-primary">
                  {step.label}
                </h3>
                <p className="mt-1 flex-1 text-sm text-text-secondary">{step.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-signal opacity-0 transition group-hover:opacity-100">
                  Open workspace
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ===================== CAPABILITIES ===================== */}
      <section className="border-t border-border bg-surface/40 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">
              Everything you can do
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Built for the full BI workflow
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-text-secondary">
              Every workspace, explained — click any card to open it.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => (
              <Link
                key={cap.label}
                href={cap.href}
                className="card-interactive group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 hover:border-signal/40 hover:shadow-glow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-signal/10 border border-signal/25 text-signal">
                    <cap.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-text-muted transition group-hover:text-signal group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
                  {cap.label}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">{cap.tagline}</p>
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {cap.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="relative mx-auto max-w-5xl px-6 py-16 text-center">
        <div
          className="glow-blob top-[-120px] left-1/2 -translate-x-1/2 h-[280px] w-[480px] bg-signal/20"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">
            Ready when you are
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Start with a single dataset
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-text-secondary">
            Upload a CSV or Excel file and follow the pipeline through profiling,
            cleaning, warehouse, analytics and reporting.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/datasets/upload">
              <Button size="lg">
                <Upload className="h-4 w-4" />
                Upload your first dataset
              </Button>
            </Link>
            <Link href="/datasets">
              <Button size="lg" variant="ghost">
                <Database className="h-4 w-4" />
                Browse datasets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Accessible fallback for disabled JS */}
      <noscript>
        <div className="sr-only">
          {capabilities.map((c) => c.label).join(", ")}
        </div>
      </noscript>
    </div>
  );
}