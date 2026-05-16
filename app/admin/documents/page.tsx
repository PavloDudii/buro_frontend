"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { UploadPanel } from "@/components/upload-panel";
import { useAuth } from "@/components/use-auth";
import { listDocuments } from "@/lib/api";
import type { ProcessingStatus } from "@/lib/types";

const statuses: Array<ProcessingStatus | ""> = [
  "",
  "queued",
  "processing",
  "completed",
  "failed",
  "unsupported",
  "needs_ocr",
];

export default function AdminDocumentsPage() {
  const auth = useAuth();
  const token = auth.requireToken();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | "">("");
  const documents = useQuery({
    queryKey: ["documents", search, statusFilter],
    queryFn: () => listDocuments(token, search, statusFilter || undefined),
    refetchInterval: 5000,
  });

  const items = documents.data?.items ?? [];
  const totals = {
    all: documents.data?.total ?? 0,
    processing: items.filter((item) => item.processing_status === "processing").length,
    failed: items.filter((item) => item.processing_status === "failed").length,
    completed: items.filter((item) => item.processing_status === "completed").length,
  };

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
              DOCUMENTS
            </p>
            <h1 className="page-title">Upload and track files</h1>
          </div>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <Metric label="Total" value={totals.all} />
            <Metric label="Processing" value={totals.processing} />
            <Metric label="Failed" value={totals.failed} />
            <Metric label="Completed" value={totals.completed} />
          </div>
        </div>
      </section>

      <UploadPanel accessToken={token} onCompleted={() => void documents.refetch()} />

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
          <h2 className="section-title">File list</h2>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <input
              className="field"
              style={{ width: 260 }}
              placeholder="Search files, hashes, uploaders"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="field"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProcessingStatus | "")}
            >
              {statuses.map((status) => (
                <option key={status || "all"} value={status}>
                  {status || "all statuses"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
                <th>Size</th>
                <th>Uploader</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong>{document.safe_filename}</strong>
                    {document.source_type === "program" ? (
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        program · {document.program_name}
                      </div>
                    ) : null}
                    {document.processing_error_code ? (
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {document.processing_error_code} · {document.processing_error_stage}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <StatusChip status={document.processing_status} />
                  </td>
                  <td>{formatBytes(document.size_bytes)}</td>
                  <td>{document.uploaded_by_email}</td>
                  <td>{new Date(document.created_at).toLocaleString()}</td>
                  <td>
                    <Link className="button button-secondary" href={`/admin/documents/${document.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                    {documents.isLoading ? "Loading documents..." : "No documents found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        minWidth: 112,
        border: "1px solid var(--line)",
        borderRadius: 16,
        background: "white",
        padding: "0.8rem",
      }}
    >
      <div className="muted" style={{ fontSize: "0.74rem", fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.45rem", fontWeight: 950 }}>{value}</div>
    </div>
  );
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
