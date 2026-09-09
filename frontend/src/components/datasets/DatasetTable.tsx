import Link from "next/link";
import { FileSpreadsheet, Trash2 } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import {
  DatasetWithHealth,
  healthVariant,
  healthLabel,
  fileType,
  formatNumber,
} from "./datasetHealth";

export default function DatasetTable({
  datasets,
  deleting,
  onDelete,
}: {
  datasets: DatasetWithHealth[];
  deleting: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Dataset</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell className="text-right">Rows</TableHeaderCell>
          <TableHeaderCell className="text-right">Columns</TableHeaderCell>
          <TableHeaderCell>Health</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {datasets.map((d) => (
          <TableRow key={d.dataset_id}>
            <TableCell>
              <Link
                href={`/datasets/${d.dataset_id}`}
                className="flex items-center gap-2.5 hover:text-signal transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-text-muted shrink-0" />
                <span className="font-medium truncate max-w-[240px]">{d.filename}</span>
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="info">{fileType(d.filename)}</Badge>
            </TableCell>
            <TableCell className="font-data text-right">{formatNumber(d.rows)}</TableCell>
            <TableCell className="font-data text-right">{d.columns}</TableCell>
            <TableCell>
              <Badge variant={healthVariant(d.health_score)}>
                {healthLabel(d.health_score)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="positive">{d.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <button
                onClick={() => onDelete(d.dataset_id)}
                disabled={deleting === d.dataset_id}
                className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-negative disabled:opacity-50 transition-colors"
                title="Delete dataset"
              >
                <Trash2 className="h-4 w-4" />
                {deleting === d.dataset_id ? "Deleting…" : "Delete"}
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}