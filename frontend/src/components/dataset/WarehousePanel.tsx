"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Boxes, Search, RefreshCw, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { getWarehouse, generateWarehouse } from "@/lib/api/warehouse";
import { WarehouseData, DataDictionaryEntry } from "@/types/warehouse";
import { cn } from "@/utils/cn";

export default function WarehousePanel({ datasetId }: { datasetId: string }) {
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [notGenerated, setNotGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getWarehouse(datasetId);
      setWarehouse(data);
      setNotGenerated(false);
    } catch {
      setNotGenerated(true);
      setWarehouse(null);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError(false);
    try {
      const data = await generateWarehouse(datasetId);
      setWarehouse(data);
      setNotGenerated(false);
    } catch {
      setError(true);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notGenerated || !warehouse) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-surface-raised p-4 border border-border">
            <Boxes className="h-6 w-6 text-signal" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">No warehouse generated yet</p>
            <p className="text-sm text-text-muted max-w-md">
              Generate an automatic star schema from this dataset to create the fact table,
              measures, dimensions, and a searchable data dictionary.
            </p>
          </div>
          {error && <p className="text-sm text-negative">Generation failed. Please try again.</p>}
          <Button onClick={handleGenerate} loading={generating}>
            <Boxes className="h-4 w-4" />
            Generate warehouse
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredDictionary = warehouse.data_dictionary.filter((d) =>
    d.column.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-[var(--radius-sm)] bg-signal/10 p-2">
            <Database className="h-4 w-4 text-signal" />
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium font-data">
              {warehouse.fact_table_name}
            </p>
            <p className="text-xs text-text-muted">
              {warehouse.measures.length} measures · {warehouse.dimensions.length} dimensions
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {/* Schema diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Schema Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[var(--radius-md)] border border-border bg-bg p-6">
            <div className="text-center">
              <div className="inline-block rounded-[var(--radius-sm)] bg-surface-raised border border-signal/40 px-4 py-3 min-w-[220px]">
                <p className="text-xs uppercase tracking-wide text-signal font-medium">Fact Table</p>
                <p className="font-data text-sm text-text-primary mt-1">{warehouse.fact_table_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {warehouse.measures.length > 0 && (
                <div className="rounded-[var(--radius-sm)] bg-surface-raised border border-positive/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-positive font-medium mb-2">Measures</p>
                  <div className="space-y-1.5">
                    {warehouse.measures.map((m) => (
                      <div key={m.column} className="flex items-center justify-between">
                        <span className="text-xs text-text-primary font-data">{m.column}</span>
                        <span className="text-[10px] text-text-muted">{m.aggregation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {warehouse.dimensions.map((dim) => (
                <div key={dim.column} className="rounded-[var(--radius-sm)] bg-surface-raised border border-info/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-info font-medium mb-2">
                    Dim · {dim.column}
                  </p>
                  <p className="text-[11px] text-text-muted font-data">{dim.dimension_table}</p>
                  <p className="text-[11px] text-text-muted mt-1 font-data">
                    {dim.distinct_values.toLocaleString()} distinct
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data dictionary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Dictionary</CardTitle>
          <div className="relative">
            <Search className="h-4 w-4 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search columns..."
              className="h-8 pl-8 pr-3 text-sm rounded-[var(--radius-sm)] bg-bg border border-border-strong focus:outline-none focus:border-signal w-48"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Column</TableHeaderCell>
                <TableHeaderCell>Data Type</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Nulls</TableHeaderCell>
                <TableHeaderCell>Distinct</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDictionary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-muted py-6">
                    No columns match &quot;{query}&quot;
                  </TableCell>
                </TableRow>
              ) : (
                filteredDictionary.map((entry: DataDictionaryEntry) => (
                  <TableRow key={entry.column}>
                    <TableCell className="font-medium">{entry.column}</TableCell>
                    <TableCell>
                      <Badge variant="info">{entry.data_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.role === "measure" ? "positive" : "signal"}>
                        {entry.role}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("font-data", entry.null_count > 0 ? "text-negative" : "text-positive")}>
                      {entry.null_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-data">{entry.distinct_values.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-surface-raised border border-border px-4 py-3">
        <Info className="h-4 w-4 text-signal mt-0.5 shrink-0" />
        <p className="text-xs text-text-muted">
          The fact table has been loaded into PostgreSQL. Use it for natural-language queries,
          dashboards, and forecasts.
        </p>
      </div>
    </div>
  );
}
