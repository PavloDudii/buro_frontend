"use client";

import { upload } from "@vercel/blob/client";
import type { PutBlobResult } from "@vercel/blob";
import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { completeDirectUpload, initDirectUpload } from "@/lib/api";

type UploadState =
  | "selected"
  | "initializing"
  | "uploading"
  | "uploaded"
  | "validating"
  | "queued"
  | "failed";

type UploadItem = {
  id: string;
  file: File;
  status: UploadState;
  progress: number;
  error?: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function UploadPanel({
  accessToken,
  onCompleted,
}: {
  accessToken: string;
  onCompleted: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);

  function addFiles(files: FileList | null) {
    if (!files) {
      return;
    }
    setItems((current) => [
      ...Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "selected" as UploadState,
        progress: 0,
        error: file.size > MAX_FILE_SIZE ? "File exceeds 50 MB." : undefined,
      })),
      ...current,
    ]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function startUpload(item: UploadItem) {
    if (item.file.size > MAX_FILE_SIZE) {
      updateItem(item.id, { status: "failed", error: "File exceeds 50 MB." });
      return;
    }

    try {
      updateItem(item.id, { status: "initializing", error: undefined, progress: 0 });
      const sha256Hash = await fileSha256(item.file);
      const intent = await initDirectUpload(accessToken, item.file, sha256Hash);

      updateItem(item.id, { status: "uploading", progress: 3 });
      const blob = (await upload(intent.pathname, item.file, {
        access: "private",
        handleUploadUrl: "/api/blob-upload",
        multipart: true,
        clientPayload: JSON.stringify({
          intentId: intent.intent_id,
          authorization: `Bearer ${accessToken}`,
          contentType: intent.content_type,
        }),
        onUploadProgress: ({ percentage }) => {
          updateItem(item.id, { progress: Math.max(3, Math.round(percentage)) });
        },
      })) as PutBlobResult;

      updateItem(item.id, { status: "uploaded", progress: 100 });
      updateItem(item.id, { status: "validating" });
      await completeDirectUpload(accessToken, {
        intentId: intent.intent_id,
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        etag: blob.etag,
      });
      updateItem(item.id, { status: "queued", progress: 100 });
      onCompleted();
      window.setTimeout(() => removeItem(item.id), 900);
    } catch (error) {
      updateItem(item.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  }

  return (
    <section className="card" style={{ padding: "1rem" }}>
      <div className="toolbar" style={{ marginBottom: "0.85rem" }}>
        <div>
          <h2 className="section-title">Upload documents</h2>
          <p className="muted" style={{ margin: "0.25rem 0 0" }}>
            Direct Blob upload, then backend validation and processing.
          </p>
        </div>
        <button className="button button-primary" type="button" onClick={() => inputRef.current?.click()}>
          Select files
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.docx,.txt,.md,.rtf,.csv,.xlsx,.pptx,.odt"
        onChange={(event) => addFiles(event.currentTarget.files)}
      />

      <div
        className="upload-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          addFiles(event.dataTransfer.files);
        }}
      >
        <div>
          <UploadCloud color="var(--lp-blue)" size={34} />
          <p style={{ margin: "0.65rem 0 0", fontWeight: 900 }}>Drop files here</p>
          <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
            PDF, DOCX, TXT, MD, RTF and supported office files up to 50 MB.
          </p>
        </div>
      </div>

      {items.length ? (
        <div style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gap: "0.55rem",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "0.75rem",
                background: "white",
              }}
            >
              <div className="toolbar">
                <div>
                  <strong>{item.file.name}</strong>
                  <div className="muted" style={{ fontSize: "0.82rem" }}>
                    {formatBytes(item.file.size)} · {item.status}
                  </div>
                </div>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={["initializing", "uploading", "validating"].includes(item.status)}
                  onClick={() => void startUpload(item)}
                >
                  {item.status === "failed" ? "Retry" : "Upload"}
                </button>
              </div>
              <div className="progress-track">
                <div className="progress-value" style={{ width: `${item.progress}%` }} />
              </div>
              {item.error ? (
                <div style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.86rem" }}>
                  {item.error}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

async function fileSha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
