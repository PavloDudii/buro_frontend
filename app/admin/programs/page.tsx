"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/components/use-auth";
import { importBachelorPrograms, listInstitutions, listPrograms } from "@/lib/api";
import type { DepartmentLinkStatus } from "@/lib/types";

const linkStatuses: Array<DepartmentLinkStatus | ""> = ["", "matched", "pending_review", "manual"];

export default function AdminProgramsPage() {
  const auth = useAuth();
  const token = auth.requireToken();
  const queryClient = useQueryClient();
  const [institutionCode, setInstitutionCode] = useState("");
  const [departmentLinkStatus, setDepartmentLinkStatus] = useState<DepartmentLinkStatus | "">("");
  const [search, setSearch] = useState("");
  const institutions = useQuery({
    queryKey: ["institutions"],
    queryFn: () => listInstitutions(token),
  });
  const programs = useQuery({
    queryKey: ["programs", institutionCode, departmentLinkStatus, search],
    queryFn: () =>
      listPrograms(token, {
        institutionCode: institutionCode || undefined,
        departmentLinkStatus,
        search,
      }),
    refetchInterval: 5000,
  });
  const sync = useMutation({
    mutationFn: () => importBachelorPrograms(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
  const items = programs.data?.items ?? [];
  const institutionItems = institutions.data?.items ?? [];

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
              PROGRAMS
            </p>
            <h1 className="page-title">Bachelor programs</h1>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              NULP program catalog with linked files and department review status.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
            {sync.data ? (
              <span className="status-chip status-active">
                {sync.data.program_count} program processed, {sync.data.created_document_count} new files
              </span>
            ) : null}
            <button
              className="button button-primary"
              type="button"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
            >
              {sync.isPending ? "Importing..." : "Import next NULP program"}
            </button>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
          <h2 className="section-title">Program list</h2>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <select
              className="field"
              style={{ width: 190 }}
              value={institutionCode}
              onChange={(event) => setInstitutionCode(event.target.value)}
            >
              <option value="">all institutions</option>
              {institutionItems.map((institution) => (
                <option key={institution.id} value={institution.code}>
                  {institution.code}
                </option>
              ))}
            </select>
            <select
              className="field"
              style={{ width: 200 }}
              value={departmentLinkStatus}
              onChange={(event) => setDepartmentLinkStatus(event.target.value as DepartmentLinkStatus | "")}
            >
              {linkStatuses.map((status) => (
                <option key={status || "all"} value={status}>
                  {status || "all link statuses"}
                </option>
              ))}
            </select>
            <input
              className="field"
              style={{ width: 260 }}
              placeholder="Search programs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Institution</th>
                <th>Department</th>
                <th>Files</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((program) => (
                <tr key={program.id}>
                  <td>
                    <strong>{program.program_name}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {program.specialty_code} · {program.specialty_name}
                    </div>
                  </td>
                  <td>
                    <strong>{program.institution_code ?? "-"}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {program.institution_name ?? "No institution linked"}
                    </div>
                  </td>
                  <td>
                    <span className={`status-chip ${program.department_link_status === "pending_review" ? "status-failed" : "status-active"}`}>
                      {program.department_link_status}
                    </span>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {program.department_name ?? "Needs review"}
                    </div>
                  </td>
                  <td>
                    {program.downloaded_document_count}/{program.document_count}
                    {program.oversized_document_count ? (
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {program.oversized_document_count} oversized
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <Link className="button button-secondary" href={`/admin/programs/${program.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center" }}>
                    {programs.isLoading ? "Loading programs..." : "No programs found."}
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
