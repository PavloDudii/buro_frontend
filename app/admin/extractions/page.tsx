"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExtractionTypeTabs, EXTRACTION_TYPE_TABS } from "@/components/extraction-type-tabs";
import { useAuth } from "@/components/use-auth";
import { listExtractionItems } from "@/lib/api";
import type { DocumentExtractionItem, ExtractionItemType } from "@/lib/types";

export default function AdminExtractionsPage() {
  const auth = useAuth();
  const token = auth.requireToken();
  const params = useSearchParams();
  const type = normalizeExtractionType(params.get("type"));
  const [search, setSearch] = useState("");
  const facts = useQuery({
    queryKey: ["extraction-items", type, search],
    queryFn: () => listExtractionItems(token, { type, search }),
    refetchInterval: 5000,
  });
  const items = (facts.data?.items ?? []).filter(isSupportedExtractionItem);

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
              FACTS
            </p>
            <h1 className="page-title">Extracted people</h1>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              Named people extracted from processed documents for relational lookup.
            </p>
          </div>
          <Metric label="Visible" value={items.length} />
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.9rem" }}>
          <ExtractionTypeTabs activeType={type} />
          <input
            className="field"
            style={{ width: 280 }}
            placeholder="Search facts or evidence"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Evidence</th>
                <th>Source document</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="status-chip status-active">{labelForType(item.type)}</span>
                  </td>
                  <td>
                    <strong>{primaryValue(item)}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {compactValueJson(item.value_json)}
                    </div>
                  </td>
                  <td className="muted" style={{ maxWidth: 420 }}>
                    {item.evidence_text ?? "No evidence saved."}
                  </td>
                  <td>
                    <Link className="button button-secondary" href={`/admin/documents/${item.document_id}`}>
                      {item.document_filename}
                    </Link>
                    {item.page_start ? (
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        page {item.page_start}
                        {item.page_end && item.page_end !== item.page_start ? `-${item.page_end}` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td>{item.confidence !== null ? `${Math.round(item.confidence * 100)}%` : "-"}</td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                    {facts.isLoading ? "Loading extracted facts..." : "No extracted facts found."}
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

function normalizeExtractionType(value: string | null): ExtractionItemType | "" {
  const allowedTypes = new Set(EXTRACTION_TYPE_TABS.map((tab) => tab.type));
  return allowedTypes.has(value as ExtractionItemType) ? (value as ExtractionItemType | "") : "";
}

function labelForType(type: string) {
  return EXTRACTION_TYPE_TABS.find((tab) => tab.type === type)?.label ?? type;
}

function primaryValue(item: DocumentExtractionItem) {
  const preferredKeysByType: Record<ExtractionItemType, string[]> = {
    person: ["person_name", "title", "raw_value"],
  };
  const preferredKeys = preferredKeysByType[item.type] ?? ["title", "raw_value"];
  for (const key of preferredKeys) {
    const value = item.value_json[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return item.type;
}

function isSupportedExtractionItem(item: DocumentExtractionItem) {
  return EXTRACTION_TYPE_TABS.some((tab) => tab.type === item.type);
}

function compactValueJson(value: Record<string, unknown>) {
  return Object.entries(value)
    .filter(([, item]) => item !== null && item !== undefined && String(item).trim() !== "")
    .slice(0, 4)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join(" · ");
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
