"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusChip } from "@/components/status-chip";
import { useAuth } from "@/components/use-auth";
import {
  deleteProgram,
  getProgram,
  listDepartments,
  listInstitutions,
  updateProgram,
  updateProgramDepartment,
  updateProgramDocument,
} from "@/lib/api";

const documentKinds = [
  "opp",
  "project",
  "self_evaluation",
  "visit_schedule",
  "accreditation_report",
  "certificate",
  "stakeholder_feedback",
  "other",
];

const importStatuses = ["queued", "downloaded", "oversized", "failed", "processed"];

export default function ProgramDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const auth = useAuth();
  const token = auth.requireToken();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const program = useQuery({
    queryKey: ["program", id],
    queryFn: () => getProgram(token, id),
    refetchInterval: 5000,
  });
  const institutions = useQuery({
    queryKey: ["institutions"],
    queryFn: () => listInstitutions(token),
  });
  const departments = useQuery({
    queryKey: ["departments", program.data?.institution_code],
    enabled: Boolean(program.data?.institution_code),
    queryFn: () =>
      listDepartments(token, {
        institutionCode: program.data?.institution_code ?? undefined,
      }),
  });
  const assignDepartment = useMutation({
    mutationFn: (departmentId: string) => updateProgramDepartment(token, id, departmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["program", id] });
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
  const saveProgram = useMutation({
    mutationFn: (formData: FormData) =>
      updateProgram(token, id, {
        field_code: textValue(formData, "field_code"),
        field_name: textValue(formData, "field_name"),
        specialty_code: textValue(formData, "specialty_code"),
        specialty_name: textValue(formData, "specialty_name"),
        program_name: textValue(formData, "program_name"),
        qualification: nullableTextValue(formData, "qualification"),
        study_form: nullableTextValue(formData, "study_form"),
        duration: nullableTextValue(formData, "duration"),
        credits: nullableTextValue(formData, "credits"),
        manager: nullableTextValue(formData, "manager"),
        program_url: nullableTextValue(formData, "program_url"),
        source_page_url: textValue(formData, "source_page_url"),
        institution_id: nullableTextValue(formData, "institution_id"),
        department_id: nullableTextValue(formData, "department_id"),
      }),
    onSuccess: async () => {
      setIsEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["program", id] });
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
  const saveProgramDocument = useMutation({
    mutationFn: ({
      documentLinkId,
      formData,
    }: {
      documentLinkId: string;
      formData: FormData;
    }) =>
      updateProgramDocument(token, id, documentLinkId, {
        title: textValue(formData, "title"),
        kind: textValue(formData, "kind"),
        import_status: textValue(formData, "import_status"),
        import_error: nullableTextValue(formData, "import_error"),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["program", id] });
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
  const removeProgram = useMutation({
    mutationFn: () => deleteProgram(token, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programs"] });
      router.push("/admin/programs");
    },
  });

  if (program.isLoading) {
    return <section className="card" style={{ padding: "1rem" }}>Loading program...</section>;
  }
  if (!program.data) {
    return <section className="card" style={{ padding: "1rem" }}>Program was not found.</section>;
  }

  return (
    <>
      <section className="card" style={{ padding: "1.2rem" }}>
        <div className="toolbar">
          <div>
            <Link className="muted" href="/admin/programs" style={{ fontWeight: 800 }}>
              Back to programs
            </Link>
            <h1 className="page-title" style={{ marginTop: "0.6rem" }}>
              {program.data.program_name}
            </h1>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              {program.data.specialty_code} · {program.data.specialty_name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span className={`status-chip ${program.data.department_link_status === "pending_review" ? "status-failed" : "status-active"}`}>
              {program.data.department_link_status}
            </span>
            <button className="button button-secondary" type="button" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? "Close edit" : "Edit"}
            </button>
            <button
              className="button button-danger"
              type="button"
              disabled={removeProgram.isPending}
              onClick={() => {
                if (window.confirm("Soft-delete this program? Linked uploaded files will be kept.")) {
                  removeProgram.mutate();
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </section>

      {isEditing ? (
        <section className="card" style={{ padding: "1rem" }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveProgram.mutate(new FormData(event.currentTarget));
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: "0.8rem" }}>
              <Field name="program_name" label="Program name" defaultValue={program.data.program_name} />
              <Field name="specialty_name" label="Specialty name" defaultValue={program.data.specialty_name} />
              <Field name="field_code" label="Field code" defaultValue={program.data.field_code} />
              <Field name="field_name" label="Field name" defaultValue={program.data.field_name} />
              <Field name="specialty_code" label="Specialty code" defaultValue={program.data.specialty_code} />
              <Field name="qualification" label="Qualification" defaultValue={program.data.qualification ?? ""} />
              <Field name="study_form" label="Study form" defaultValue={program.data.study_form ?? ""} />
              <Field name="duration" label="Duration" defaultValue={program.data.duration ?? ""} />
              <Field name="credits" label="Credits" defaultValue={program.data.credits ?? ""} />
              <Field name="manager" label="Manager" defaultValue={program.data.manager ?? ""} />
              <Field name="program_url" label="Directory URL" defaultValue={program.data.program_url ?? ""} />
              <Field name="source_page_url" label="Source page URL" defaultValue={program.data.source_page_url} />
              <label>
                <span className="muted" style={{ display: "block", fontSize: "0.74rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                  Institution
                </span>
                <select className="field" name="institution_id" defaultValue={program.data.institution_id ?? ""}>
                  <option value="">none</option>
                  {(institutions.data?.items ?? []).map((institution) => (
                    <option key={institution.id} value={institution.id}>
                      {institution.code} · {institution.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted" style={{ display: "block", fontSize: "0.74rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                  Department
                </span>
                <select className="field" name="department_id" defaultValue={program.data.department_id ?? ""}>
                  <option value="">pending review</option>
                  {(departments.data?.items ?? []).map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.9rem" }}>
              <button className="button button-primary" type="submit" disabled={saveProgram.isPending}>
                Save program
              </button>
              <button className="button button-secondary" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ alignItems: "start" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(180px, 1fr))", gap: "0.9rem", flex: 1 }}>
            <Meta label="Institution" value={program.data.institution_name ?? "-"} />
            <Meta label="Department" value={program.data.department_name ?? "Pending review"} />
            <Meta label="Qualification" value={program.data.qualification ?? "-"} />
            <Meta label="Study form" value={program.data.study_form ?? "-"} />
            <Meta label="Duration" value={program.data.duration ?? "-"} />
            <Meta label="Credits" value={program.data.credits ?? "-"} />
            <Meta label="Manager" value={program.data.manager ?? "-"} />
            <Meta label="Directory" value={program.data.program_url ?? "-"} />
          </div>
          <div style={{ display: "grid", gap: "0.55rem", minWidth: 260 }}>
            <label className="muted" htmlFor="department-select" style={{ fontWeight: 900 }}>
              Manual department
            </label>
            <select
              id="department-select"
              className="field"
              value={program.data.department_id ?? ""}
              disabled={!departments.data?.items.length || assignDepartment.isPending}
              onChange={(event) => {
                if (event.target.value) {
                  assignDepartment.mutate(event.target.value);
                }
              }}
            >
              <option value="">select department</option>
              {(departments.data?.items ?? []).map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {program.data.directory_snapshot ? (
        <section className="card" style={{ padding: "1rem" }}>
          <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
            <h2 className="section-title">Directory profile</h2>
            <span className="status-chip status-active">{program.data.directory_snapshot.year ?? "latest"}</span>
          </div>
          <div className="muted" style={{ overflowWrap: "anywhere", marginBottom: "0.8rem" }}>
            {program.data.directory_snapshot.source_url}
          </div>
          <div style={{ display: "grid", gap: "0.55rem" }}>
            {program.data.directory_snapshot.sections_json.map((section, index) => (
              <details key={`${String(section.title)}-${index}`} open={index < 2}>
                <summary style={{ cursor: "pointer", fontWeight: 900 }}>{String(section.title ?? "Section")}</summary>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{String(section.body ?? "")}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card" style={{ padding: "1rem" }}>
        <div className="toolbar" style={{ marginBottom: "0.8rem" }}>
          <h2 className="section-title">Linked files</h2>
          <span className="status-chip status-active">{program.data.documents.length} files</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Kind</th>
                <th>Import</th>
                <th>Processing</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {program.data.documents.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong>{document.title}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem", overflowWrap: "anywhere" }}>
                      {document.source_url}
                    </div>
                  </td>
                  <td>{document.kind}</td>
                  <td>
                    <span className={`status-chip ${document.import_status === "failed" || document.import_status === "oversized" ? "status-failed" : "status-active"}`}>
                      {document.import_status}
                    </span>
                    {document.source_size_label ? (
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {document.source_size_label}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {document.processing_status ? <StatusChip status={document.processing_status} /> : "-"}
                    {document.uploaded_document_id ? (
                      <div style={{ marginTop: "0.35rem" }}>
                        <Link
                          className="button button-secondary"
                          href={`/admin/documents/${document.uploaded_document_id}`}
                        >
                          Open document
                        </Link>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <details>
                      <summary className="button button-secondary" style={{ minHeight: 34, cursor: "pointer" }}>
                        Edit
                      </summary>
                      <form
                        style={{ display: "grid", gap: "0.45rem", marginTop: "0.55rem", minWidth: 260 }}
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveProgramDocument.mutate({
                            documentLinkId: document.id,
                            formData: new FormData(event.currentTarget),
                          });
                        }}
                      >
                        <input className="field" name="title" defaultValue={document.title} />
                        <select className="field" name="kind" defaultValue={document.kind}>
                          {documentKinds.map((kind) => (
                            <option key={kind} value={kind}>{kind}</option>
                          ))}
                        </select>
                        <select className="field" name="import_status" defaultValue={document.import_status}>
                          {importStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <textarea
                          className="field"
                          name="import_error"
                          rows={3}
                          defaultValue={document.import_error ?? ""}
                          placeholder="Import note"
                        />
                        <button className="button button-primary" type="submit" disabled={saveProgramDocument.isPending}>
                          Save file
                        </button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="muted" style={{ fontSize: "0.74rem", fontWeight: 900 }}>
        {label}
      </dt>
      <dd style={{ margin: "0.25rem 0 0", overflowWrap: "anywhere", fontWeight: 800 }}>{value}</dd>
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label>
      <span className="muted" style={{ display: "block", fontSize: "0.74rem", fontWeight: 900, marginBottom: "0.25rem" }}>
        {label}
      </span>
      <input className="field" name={name} defaultValue={defaultValue} />
    </label>
  );
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableTextValue(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value || null;
}
