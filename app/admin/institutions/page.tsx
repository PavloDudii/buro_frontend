"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/components/use-auth";
import { listDepartments, listInstitutions } from "@/lib/api";

export default function AdminInstitutionsPage() {
  const auth = useAuth();
  const token = auth.requireToken();
  const [institutionCode, setInstitutionCode] = useState("");
  const [search, setSearch] = useState("");
  const institutions = useQuery({
    queryKey: ["institutions"],
    queryFn: () => listInstitutions(token),
  });
  const departments = useQuery({
    queryKey: ["departments", institutionCode, search],
    queryFn: () =>
      listDepartments(token, {
        institutionCode: institutionCode || undefined,
        search,
      }),
  });
  const items = institutions.data?.items ?? [];
  const departmentItems = departments.data?.items ?? [];

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <p className="muted" style={{ margin: 0, fontWeight: 900 }}>
              INSTITUTIONS
            </p>
            <h1 className="page-title">NULP institutions</h1>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              Canonical institutions and departments stored by the system, not extracted from uploaded documents.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <Metric label="Institutions" value={institutions.data?.total ?? items.length} />
            <Metric label="Departments" value={departments.data?.total ?? departmentItems.length} />
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((institution) => (
                <tr key={institution.id}>
                  <td>
                    <strong>{institution.code}</strong>
                  </td>
                  <td>{institution.name}</td>
                  <td>
                    <span className="status-chip status-active">
                      {institution.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={3} className="muted" style={{ textAlign: "center" }}>
                    {institutions.isLoading ? "Loading institutions..." : "No institutions found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
          <h2 className="section-title">Departments</h2>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <select
              className="field"
              style={{ width: 240 }}
              value={institutionCode}
              onChange={(event) => setInstitutionCode(event.target.value)}
            >
              <option value="">all institutions</option>
              {items.map((institution) => (
                <option key={institution.id} value={institution.code}>
                  {institution.code}
                </option>
              ))}
            </select>
            <input
              className="field"
              style={{ width: 280 }}
              placeholder="Search departments"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departmentItems.map((department) => (
                <tr key={department.id}>
                  <td>
                    <strong>{department.institution_code}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {department.institution_name}
                    </div>
                  </td>
                  <td>{department.name}</td>
                  <td>
                    <span className="status-chip status-active">
                      {department.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {!departmentItems.length ? (
                <tr>
                  <td colSpan={3} className="muted" style={{ textAlign: "center" }}>
                    {departments.isLoading ? "Loading departments..." : "No departments found."}
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
