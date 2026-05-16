"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusChip } from "@/components/status-chip";
import { useAuth } from "@/components/use-auth";
import { deleteDocument, getDocument, getProcessingDetails, reprocessDocument } from "@/lib/api";

const PROCESSING_STAGE_ORDER = ["blob_read", "parse", "chunk", "embed", "extract", "persist"];
const PROCESSING_STAGE_LABELS: Record<string, string> = {
  blob_read: "Read file",
  parse: "Parse text",
  chunk: "Create chunks",
  embed: "Create embeddings",
  extract: "Extract SQL facts",
  persist: "Save results",
};

export default function DocumentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const auth = useAuth();
  const token = auth.requireToken();
  const router = useRouter();
  const queryClient = useQueryClient();

  const document = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(token, id),
    refetchInterval: 5000,
  });
  const processing = useQuery({
    queryKey: ["document-processing", id],
    queryFn: () => getProcessingDetails(token, id),
    refetchInterval: 5000,
  });
  const reprocess = useMutation({
    mutationFn: () => reprocessDocument(token, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["document", id] });
      await queryClient.invalidateQueries({ queryKey: ["document-processing", id] });
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteDocument(token, id),
    onSuccess: () => router.replace("/admin/documents"),
  });

  if (document.isLoading) {
    return <section className="card" style={{ padding: "1rem" }}>Loading document...</section>;
  }
  if (!document.data) {
    return <section className="card" style={{ padding: "1rem" }}>Document was not found.</section>;
  }

  const latestRun = processing.data?.latest_run;

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <Link className="muted" href="/admin/documents" style={{ fontWeight: 800 }}>
              Back to documents
            </Link>
            <h1 className="page-title" style={{ marginTop: "0.6rem" }}>
              {document.data.safe_filename}
            </h1>
          </div>
          <StatusChip status={document.data.processing_status} />
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
          <h2 className="section-title">Actions</h2>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button
              className="button button-secondary"
              type="button"
              disabled={reprocess.isPending}
              onClick={() => reprocess.mutate()}
            >
              {reprocess.isPending ? "Queueing..." : "Retry processing"}
            </button>
            <button
              className="button button-danger"
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "Deleting..." : "Soft delete"}
            </button>
          </div>
        </div>
        {reprocess.error ? (
          <div style={{ color: "var(--danger)", fontWeight: 700 }}>{reprocess.error.message}</div>
        ) : null}
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <h2 className="section-title" style={{ marginBottom: "0.8rem" }}>
          Metadata
        </h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.85rem",
          }}
        >
          <Meta label="Original filename" value={document.data.original_filename} />
          <Meta label="Size" value={`${(document.data.size_bytes / 1024 / 1024).toFixed(2)} MB`} />
          <Meta label="Uploader" value={document.data.uploaded_by_email} />
          <Meta label="Hash" value={document.data.sha256_hash.slice(0, 18) + "..."} />
          <Meta label="Storage key" value={document.data.storage_key ?? "missing"} />
          <Meta label="Parser" value={document.data.parser_version ?? "not set"} />
        </dl>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
          <h2 className="section-title">Processing metrics</h2>
          {latestRun?.total_duration_ms ? (
            <span className="status-chip status-active">{latestRun.total_duration_ms} ms total</span>
          ) : null}
        </div>
        {processing.data?.processing_error ? (
          <div style={{ color: "var(--danger)", fontWeight: 800, marginBottom: "0.8rem" }}>
            {processing.data.processing_error}
          </div>
        ) : null}
        {latestRun ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Counts</th>
                </tr>
              </thead>
              <tbody>
                {orderedStageEntries(latestRun.stage_metrics).map(([stage, metrics]) => (
                  <tr key={stage}>
                    <td>
                      <strong>{PROCESSING_STAGE_LABELS[stage] ?? stage}</strong>
                    </td>
                    <td>{String(metrics.status ?? "-")}</td>
                    <td>{String(metrics.duration_ms ?? "-")} ms</td>
                    <td className="muted">{summarizeMetrics(metrics)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No processing run has started yet.</p>
        )}
      </section>
    </>
  );
}

function orderedStageEntries(stageMetrics: Record<string, Record<string, unknown>>) {
  const knownStages = PROCESSING_STAGE_ORDER.flatMap((stage) => {
    const metrics = stageMetrics[stage];
    return metrics ? ([[stage, metrics]] as Array<[string, Record<string, unknown>]>) : [];
  });
  const extraStages = Object.entries(stageMetrics).filter(
    ([stage]) => !PROCESSING_STAGE_ORDER.includes(stage),
  );
  return [...knownStages, ...extraStages];
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "0.8rem", background: "white" }}>
      <dt className="muted" style={{ fontSize: "0.74rem", fontWeight: 900 }}>
        {label}
      </dt>
      <dd style={{ margin: "0.25rem 0 0", overflowWrap: "anywhere", fontWeight: 800 }}>{value}</dd>
    </div>
  );
}

function summarizeMetrics(metrics: Record<string, unknown>) {
  return Object.entries(metrics)
    .filter(([key]) => !["status", "started_at", "completed_at", "duration_ms"].includes(key))
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}
