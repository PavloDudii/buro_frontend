import type { ProcessingStatus } from "@/lib/types";

const labelByStatus: Record<ProcessingStatus, string> = {
  not_started: "Not started",
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  unsupported: "Unsupported",
  needs_ocr: "Needs OCR",
};

const classByStatus: Record<ProcessingStatus, string> = {
  not_started: "status-neutral",
  queued: "status-active",
  processing: "status-active",
  completed: "status-success",
  failed: "status-danger",
  unsupported: "status-warning",
  needs_ocr: "status-warning",
};

export function StatusChip({ status }: { status: ProcessingStatus }) {
  return <span className={`status-chip ${classByStatus[status]}`}>{labelByStatus[status]}</span>;
}
