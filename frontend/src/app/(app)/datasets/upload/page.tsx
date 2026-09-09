"use client";

import { useCallback, useState, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { uploadDataset } from "@/lib/api/datasets";
import { useToast } from "@/components/ui/Toast";
import { isAxiosError } from "axios";
import { cn } from "@/utils/cn";

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export default function UploadDatasetPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function validateAndSetFile(selected: File | undefined) {
    if (!selected) return;
    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Only CSV and Excel files (.csv, .xlsx, .xls) are supported.");
      return;
    }
    setError("");
    setFile(selected);
  }

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  }, []);

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(e.target.files?.[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const dataset = await uploadDataset(file, setProgress);
      showToast(`"${dataset.filename}" uploaded successfully`, "success");
      router.push(`/datasets/${dataset.dataset_id}`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Upload failed. Please try again.");
      }
      setUploading(false);
    }
  }

  return (
    <div className="page-shell max-w-2xl">
      <div>
        <Link
          href="/datasets"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-signal mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to datasets
        </Link>
        <h1 className="page-title">Upload Dataset</h1>
        <p className="page-subtitle">
          Upload a CSV or Excel file to begin analysis.
        </p>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "border-2 border-dashed rounded-[var(--radius-lg)] py-20 flex flex-col items-center justify-center gap-4 text-center transition-all duration-200",
            dragOver
              ? "border-signal bg-signal-soft scale-[1.01]"
              : "border-border bg-surface"
          )}
        >
          <div
            className={cn(
              "rounded-full p-4 border transition-colors",
              dragOver ? "bg-signal/15 border-signal/30" : "bg-surface-raised border-border"
            )}
          >
            <UploadCloud
              className={cn("h-8 w-8", dragOver ? "text-signal" : "text-text-muted")}
            />
          </div>
          <div>
            <p className="text-sm text-text-primary">
              Drag &amp; drop your file here, or{" "}
              <label className="text-signal font-medium hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={onFileInputChange}
                />
              </label>
            </p>
            <p className="text-xs text-text-muted mt-1.5">
              CSV, XLSX, or XLS — up to a reasonable size
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-[var(--radius-sm)] bg-signal/10 border border-signal/20 p-2.5 shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-signal" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">{file.name}</p>
                <p className="text-xs text-text-muted font-data">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!uploading && (
              <button
                onClick={() => setFile(null)}
                className="rounded-md p-1.5 text-text-muted hover:text-negative hover:bg-negative/10 transition-colors"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {uploading && (
            <div>
              <div className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden">
                <div
                  className="h-full bg-signal transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted font-data mt-2">{progress}% uploaded</p>
            </div>
          )}

          {!uploading && (
            <Button onClick={handleUpload} className="w-full" size="lg">
              <CheckCircle2 className="h-4 w-4" />
              Confirm &amp; Upload
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-negative bg-negative/10 border border-negative/30 rounded-[var(--radius-sm)] px-4 py-3">
          {error}
        </p>
      )}
    </div>
  );
}