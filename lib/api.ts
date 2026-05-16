import type {
  AuthResponse,
  DepartmentListResponse,
  DepartmentLinkStatus,
  DirectUploadInitResponse,
  DocumentExtractionItemListResponse,
  EducationProgram,
  EducationProgramDetail,
  EducationProgramListResponse,
  ExtractionItemType,
  InstitutionListResponse,
  DocumentListResponse,
  DocumentRecord,
  ProgramImportRun,
  ProgramDocument,
  ProcessingDetails,
  User,
  UserListResponse,
  UserRole,
} from "@/lib/types";

export const API_BASE_URL =
  `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "")}/api/v1`;

type Refresher = () => Promise<string>;
let _refresher: Refresher | null = null;
let _refreshPromise: Promise<string> | null = null;

export function setRefresher(fn: Refresher | null): void {
  _refresher = fn;
  _refreshPromise = null;
}

async function tryRefresh(): Promise<string> {
  if (!_refreshPromise) {
    _refreshPromise = _refresher!().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

type ApiOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  signal?: AbortSignal;
  _isRetry?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    if (response.status === 401 && _refresher && !options._isRetry) {
      try {
        const newToken = await tryRefresh();
        return apiFetch<T>(path, { ...options, token: newToken, _isRetry: true });
      } catch {
        // refresh failed — fall through and throw original error
      }
    }
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { detail?: string; error?: { message?: string } };
      message = payload.detail ?? payload.error?.message ?? message;
    } catch {
      // Response body is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register(input: { email: string; fullName: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: {
      email: input.email,
      full_name: input.fullName,
      password: input.password,
    },
  });
}

export function refresh(refreshToken: string) {
  return apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function getMe(token: string) {
  return apiFetch<User>("/users/me", { token });
}

export function listDocuments(token: string, search: string, status?: string) {
  const params = new URLSearchParams({ limit: "100", offset: "0" });
  if (search.trim()) {
    params.set("search", search.trim());
  }
  return apiFetch<DocumentListResponse>(`/documents?${params.toString()}`, { token }).then(
    (payload) => ({
      ...payload,
      items: status ? payload.items.filter((item) => item.processing_status === status) : payload.items,
    }),
  );
}

export function getDocument(token: string, documentId: string) {
  return apiFetch<DocumentRecord>(`/documents/${documentId}`, { token });
}

export function getProcessingDetails(token: string, documentId: string) {
  return apiFetch<ProcessingDetails>(`/documents/${documentId}/processing`, { token });
}

export function reprocessDocument(token: string, documentId: string) {
  return apiFetch<DocumentRecord>(`/documents/${documentId}/processing`, {
    method: "POST",
    token,
  });
}

export function deleteDocument(token: string, documentId: string) {
  return apiFetch<void>(`/documents/${documentId}`, {
    method: "DELETE",
    token,
  });
}

export function initDirectUpload(token: string, file: File, sha256Hash?: string) {
  return apiFetch<DirectUploadInitResponse>("/documents/uploads/direct/init", {
    method: "POST",
    token,
    body: {
      original_filename: file.name,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      sha256_hash: sha256Hash,
    },
  });
}

export function completeDirectUpload(
  token: string,
  input: {
    intentId: string;
    pathname: string;
    url?: string;
    downloadUrl?: string;
    etag?: string;
  },
) {
  return apiFetch<DocumentRecord>("/documents/uploads/direct/complete", {
    method: "POST",
    token,
    body: {
      intent_id: input.intentId,
      pathname: input.pathname,
      url: input.url,
      download_url: input.downloadUrl,
      etag: input.etag,
    },
  });
}

export function listExtractionItems(
  token: string,
  filters: {
    type?: ExtractionItemType | "";
    search?: string;
  } = {},
) {
  const params = new URLSearchParams({ limit: "100", offset: "0" });
  if (filters.type) {
    params.set("type", filters.type);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  return apiFetch<DocumentExtractionItemListResponse>(
    `/documents/extraction-items?${params.toString()}`,
    { token },
  );
}

export function listInstitutions(token: string) {
  return apiFetch<InstitutionListResponse>("/institutions", { token });
}

export function listDepartments(
  token: string,
  filters: {
    institutionCode?: string;
    search?: string;
  } = {},
) {
  const params = new URLSearchParams();
  if (filters.institutionCode) {
    params.set("institution_code", filters.institutionCode);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  const query = params.toString();
  return apiFetch<DepartmentListResponse>(`/institutions/departments${query ? `?${query}` : ""}`, {
    token,
  });
}

export function importBachelorPrograms(token: string) {
  return apiFetch<ProgramImportRun>("/programs/import/nulp/bachelor", {
    method: "POST",
    token,
  });
}

export function listPrograms(
  token: string,
  filters: {
    institutionCode?: string;
    departmentLinkStatus?: DepartmentLinkStatus | "";
    search?: string;
  } = {},
) {
  const params = new URLSearchParams({ limit: "100", offset: "0" });
  if (filters.institutionCode) {
    params.set("institution_code", filters.institutionCode);
  }
  if (filters.departmentLinkStatus) {
    params.set("department_link_status", filters.departmentLinkStatus);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  return apiFetch<EducationProgramListResponse>(`/programs?${params.toString()}`, { token });
}

export function getProgram(token: string, programId: string) {
  return apiFetch<EducationProgramDetail>(`/programs/${programId}`, { token });
}

export function updateProgramDepartment(token: string, programId: string, departmentId: string) {
  return apiFetch<EducationProgram>(`/programs/${programId}/department`, {
    method: "PATCH",
    token,
    body: { department_id: departmentId },
  });
}

export function updateProgram(
  token: string,
  programId: string,
  body: Partial<{
    field_code: string;
    field_name: string;
    specialty_code: string;
    specialty_name: string;
    program_name: string;
    qualification: string | null;
    study_form: string | null;
    duration: string | null;
    credits: string | null;
    manager: string | null;
    program_url: string | null;
    source_page_url: string;
    institution_id: string | null;
    department_id: string | null;
  }>,
) {
  return apiFetch<EducationProgram>(`/programs/${programId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function updateProgramDocument(
  token: string,
  programId: string,
  documentLinkId: string,
  body: Partial<{
    title: string;
    kind: string;
    import_status: string;
    import_error: string | null;
  }>,
) {
  return apiFetch<ProgramDocument>(`/programs/${programId}/documents/${documentLinkId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function deleteProgram(token: string, programId: string) {
  return apiFetch<void>(`/programs/${programId}`, {
    method: "DELETE",
    token,
  });
}

export function listUsers(token: string, search: string) {
  const params = new URLSearchParams({ limit: "100", offset: "0" });
  if (search.trim()) {
    params.set("search", search.trim());
  }
  return apiFetch<UserListResponse>(`/users?${params.toString()}`, { token });
}

export function updateUserRole(token: string, email: string, role: UserRole) {
  return apiFetch<User>("/users/role", {
    method: "PATCH",
    token,
    body: { email, role },
  });
}
