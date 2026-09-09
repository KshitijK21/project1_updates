"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { Send, Bot, User, Sparkles, Code2, MessageSquareText, Database } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeletons";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";
import { listDatasets } from "@/lib/api/datasets";
import { generateWarehouse, getWarehouse } from "@/lib/api/warehouse";
import { queryDataset } from "@/lib/api/ai";
import { AiQueryResult } from "@/types/ai";
import { cn } from "@/utils/cn";

interface Entry {
  id: string;
  question?: string;
  loading?: boolean;
  error?: string;
  result?: AiQueryResult;
}

const SUGGESTIONS = [
  "Show total by each dimension",
  "What is the average of the main measures?",
  "Which dimension value contributes the most?",
];

export default function AnalyticsPage() {
  const [datasets, setDatasets] = useState<{ dataset_id: string; filename: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [columnsReady, setColumnsReady] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [warehouseError, setWarehouseError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await listDatasets();
        setDatasets(list);
      } catch {
        setError(true);
      } finally {
        setLoadingDatasets(false);
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries]);

  async function selectDataset(id: string) {
    setSelectedId(id);
    setEntries([]);
    setColumnsReady(false);
    setWarehouseError("");
    try {
      await getWarehouse(id);
      setColumnsReady(true);
    } catch {
      setPreparing(true);
      try {
        await generateWarehouse(id);
        setColumnsReady(true);
      } catch {
        setWarehouseError("Warehouse generation failed. Check the dataset, then try again.");
      } finally {
        setPreparing(false);
      }
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || !selectedId || busy) return;
    setBusy(true);
    setInput("");
    const userEntry: Entry = { id: crypto.randomUUID(), question: q };
    const loadEntry: Entry = { id: crypto.randomUUID(), loading: true };
    setEntries((prev) => [...prev, userEntry, loadEntry]);
    try {
      const result = await queryDataset(selectedId, q);
      setEntries((prev) => prev.map((e) => (e.id === loadEntry.id ? { ...e, loading: false, result } : e)));
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Query failed. Ensure the warehouse was generated first.";
      setEntries((prev) => prev.map((e) => (e.id === loadEntry.id ? { ...e, loading: false, error: detail } : e)));
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  if (loadingDatasets) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="page-shell">
        <ErrorState message="Unable to load datasets." />
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={MessageSquareText}
          title="No datasets available"
          description="Upload a dataset and generate its warehouse to start asking questions."
        />
      </div>
    );
  }

  return (
    <div className="page-shell !max-w-5xl !flex-nowrap h-[calc(100vh-4rem)] !mb-0 !pb-0">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Explore patterns, trends and insights across your data.
        </p>
      </div>

      <div className="max-w-md">
        <Select
          label="Dataset"
          value={selectedId}
          onChange={(e) => selectDataset(e.target.value)}
          options={datasets.map((d) => ({ value: d.dataset_id, label: d.filename }))}
        />
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <span className="text-xs text-text-muted flex items-center gap-2">
            <span className="rounded-[var(--radius-sm)] bg-signal/10 border border-signal/20 p-1.5">
              <Bot className="h-3.5 w-3.5 text-signal" />
            </span>
            AI Assistant
          </span>
          <div className="flex items-center gap-2">
            {preparing && (
              <Badge variant="signal" className="animate-pulse">
                Generating warehouse…
              </Badge>
            )}
            {selectedId && columnsReady && (
              <Badge variant="positive">
                <Database className="h-3 w-3 mr-1" />
                Ready to query
              </Badge>
            )}
            {selectedId && !columnsReady && !preparing && !warehouseError && (
              <Badge variant="signal">Preparing warehouse…</Badge>
            )}
          </div>
        </div>

        {selectedId && warehouseError && !preparing && (
          <div className="px-5 py-2.5 border-b border-border bg-negative/10 text-sm text-negative">
            {warehouseError}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0">
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 h-full py-16 text-center">
              <div className="rounded-full bg-signal/10 border border-signal/20 p-4">
                <Sparkles className="h-6 w-6 text-signal" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-display font-semibold text-text-primary">
                  Ask anything about your data
                </p>
                <p className="text-sm text-text-muted max-w-sm mx-auto">
                  Select a dataset with a generated warehouse, then ask things like:
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={!selectedId || !columnsReady || preparing}
                    onClick={() => ask(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface-raised text-text-secondary hover:text-signal hover:border-signal-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {entries.map((entry) => (
            <div key={entry.id}>
              {entry.question && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-br-[4px] bg-signal/15 border border-signal/25 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-signal font-medium uppercase tracking-wide mb-1">
                      <User className="h-3 w-3" /> You
                    </div>
                    <p className="text-sm text-text-primary">{entry.question}</p>
                  </div>
                </div>
              )}

              {entry.loading && (
                <div className="flex justify-start mt-3">
                  <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-[4px] bg-surface-raised border border-border px-4 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium uppercase tracking-wide mb-2.5">
                      <Bot className="h-3 w-3" /> Thinking…
                    </div>
                    <div className="flex gap-1.5" role="status" aria-label="Generating answer">
                      <span className="h-2 w-2 rounded-full bg-signal/50 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-signal/50 animate-bounce [animation-delay:100ms]" />
                      <span className="h-2 w-2 rounded-full bg-signal/50 animate-bounce [animation-delay:200ms]" />
                    </div>
                  </div>
                </div>
              )}

              {entry.error && (
                <div className="flex justify-start mt-3">
                  <div className="max-w-[85%] rounded-[var(--radius-md)] rounded-bl-[4px] bg-negative/10 border border-negative/30 px-4 py-3">
                    <p className="text-sm text-negative">{entry.error}</p>
                  </div>
                </div>
              )}

              {entry.result && (
                <div className="flex justify-start mt-3">
                  <div className="w-full max-w-[95%] rounded-[var(--radius-md)] rounded-bl-[4px] overflow-hidden border border-border bg-surface shadow-sm">
                    <div className="bg-surface-raised px-4 py-2.5 flex items-center gap-2 border-b border-border">
                      <Bot className="h-3.5 w-3.5 text-signal" />
                      <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">
                        Assistant
                      </span>
                    </div>
                    <div className="p-5 space-y-5">
                      <p className="text-sm text-text-primary leading-relaxed">
                        {entry.result.explanation}
                      </p>

                      <div className="rounded-[var(--radius-sm)] border border-border bg-bg overflow-hidden">
                        <div className="px-4 py-2 bg-surface-raised flex items-center gap-2 border-b border-border">
                          <Code2 className="h-3 w-3 text-text-muted" />
                          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">
                            Generated SQL
                          </span>
                        </div>
                        <pre className="px-4 py-3 text-xs font-data text-positive overflow-x-auto text-[11px]">
                          {entry.result.generated_sql}
                        </pre>
                      </div>

                      {entry.result.result.length > 0 ? (
                        <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-border">
                          <table className="w-full text-xs font-data">
                            <thead className="bg-surface-raised">
                              <tr>
                                {Object.keys(entry.result.result[0]).map((k) => (
                                  <th key={k} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wide text-text-muted">
                                    {k}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {entry.result.result.slice(0, 50).map((row, i) => (
                                <tr key={i} className="hover:bg-surface-raised/50">
                                  {Object.keys(row).map((k) => (
                                    <td key={k} className="px-3 py-2 text-text-primary">
                                      {String(row[k] ?? "—")}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted">No results returned.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              preparing
                ? "Generating warehouse…"
                : selectedId && columnsReady
                  ? "Ask a question about this dataset... e.g. What are the biggest trends this month?"
                  : "Select a dataset to enable queries"
            }
            disabled={!selectedId || !columnsReady || preparing || busy}
            className={cn(
              "flex-1 h-11 px-4 text-sm rounded-[var(--radius-sm)] bg-bg border border-border-strong",
              "focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 transition-colors",
              "placeholder:text-text-muted disabled:opacity-50"
            )}
            aria-label="Ask a question about your data"
          />
          <Button type="submit" disabled={!input.trim() || !selectedId || !columnsReady || preparing || busy} loading={busy}>
            {!busy && <Send className="h-4 w-4" />}
            Ask
          </Button>
        </form>
      </Card>
    </div>
  );
}