import type { Dataset } from "@/types/dataset";

export interface DatasetWithHealth extends Dataset {
  health_score: number | null;
}

export function healthVariant(
  score: number | null
): "positive" | "signal" | "negative" | "default" {
  if (score === null) return "default";
  if (score >= 80) return "positive";
  if (score >= 60) return "signal";
  return "negative";
}

export function healthLabel(score: number | null): string {
  if (score === null) return "Not profiled";
  return `Health ${Math.round(score)}`;
}

export function fileType(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  return ext ?? "UNKNOWN";
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}