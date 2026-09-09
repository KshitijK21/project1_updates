"use client";

import { useEffect, useState } from "react";
import { Shield, User, Clock, Activity } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeletons";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { getAuditLogs } from "@/lib/api/audit";
import { AuditLogEntry } from "@/types/audit";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAuditLogs();
        setLogs(res.logs);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <ErrorState message="Unable to load audit logs. Admin access required." />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">
            Admin only. Recent activity across the platform.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
          <Shield className="h-4 w-4 text-signal" />
          <span className="text-sm text-text-secondary">{logs.length} events</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No audit logs"
          description="No activity has been recorded yet."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
              <TableHeaderCell>Endpoint</TableHeaderCell>
              <TableHeaderCell>Timestamp</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, i) => (
              <TableRow key={i}>
                <TableCell>
                  <span className="flex items-center gap-1.5 font-data text-[13px]">
                    <User className="h-3.5 w-3.5 text-text-muted" />
                    {log.user_email}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="info">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-text-secondary font-data text-xs">
                  {log.endpoint}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(log.timestamp)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}