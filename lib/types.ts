export type UserRole = "admin" | "user";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type AuthResponse = {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type ProcessingStatus =
  | "not_started"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "unsupported"
  | "needs_ocr";

export type ExtractionItemType = "person";

export type Institution = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InstitutionListResponse = {
  items: Institution[];
  total: number;
};

export type Department = {
  id: string;
  institution_id: string;
  institution_code: string;
  institution_name: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentListResponse = {
  items: Department[];
  total: number;
};

export type DepartmentLinkStatus = "matched" | "pending_review" | "manual";

export type EducationProgram = {
  id: string;
  level: "bachelor";
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
  institution_code: string | null;
  institution_name: string | null;
  department_id: string | null;
  department_name: string | null;
  department_link_status: DepartmentLinkStatus;
  department_match_confidence: number | null;
  deleted_at: string | null;
  document_count: number;
  downloaded_document_count: number;
  oversized_document_count: number;
  failed_document_count: number;
  created_at: string;
  updated_at: string;
};

export type ProgramDirectorySnapshot = {
  id: string;
  program_id: string;
  source_url: string;
  year: number | null;
  raw_text: string;
  structured_json: Record<string, unknown>;
  sections_json: Array<Record<string, unknown>>;
  parsed_at: string;
  created_at: string;
  updated_at: string;
};

export type ProgramDocument = {
  id: string;
  program_id: string;
  uploaded_document_id: string | null;
  source_url: string;
  title: string;
  kind: string;
  source_size_label: string | null;
  source_size_bytes: number | null;
  import_status: "queued" | "downloaded" | "oversized" | "failed" | "processed";
  import_error: string | null;
  document_filename: string | null;
  processing_status: ProcessingStatus | null;
  created_at: string;
  updated_at: string;
};

export type EducationProgramDetail = EducationProgram & {
  documents: ProgramDocument[];
  directory_snapshot: ProgramDirectorySnapshot | null;
};

export type EducationProgramListResponse = {
  items: EducationProgram[];
  total: number;
  limit: number;
  offset: number;
};

export type ProgramImportRun = {
  id: string;
  source_url: string;
  status: "completed" | "failed";
  program_count: number;
  created_document_count: number;
  oversized_document_count: number;
  failed_document_count: number;
  matched_program_count: number;
  pending_review_program_count: number;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRecord = {
  id: string;
  original_filename: string;
  safe_filename: string;
  content_type: string;
  file_extension: string;
  size_bytes: number;
  sha256_hash: string;
  storage_key: string | null;
  deleted_at: string | null;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  processing_error_code: string | null;
  processing_error_stage: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  parser_version: string | null;
  extraction_version: string | null;
  source_type: "uploaded" | "program";
  program_id: string | null;
  program_name: string | null;
  uploaded_by_id: string;
  uploaded_by_email: string;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  items: DocumentRecord[];
  total: number;
  limit: number | null;
  offset: number | null;
};

export type DirectUploadInitResponse = {
  intent_id: string;
  document_id: string;
  pathname: string;
  original_filename: string;
  safe_filename: string;
  content_type: string;
  file_extension: string;
  size_bytes: number;
  sha256_hash: string | null;
  status: "pending" | "uploading" | "validating" | "completed" | "failed" | "expired";
  expires_at: string;
};

export type ProcessingRun = {
  id: string;
  document_id: string;
  status: ProcessingStatus;
  started_at: string;
  completed_at: string | null;
  total_duration_ms: number | null;
  error_code: string | null;
  error_stage: string | null;
  error_message: string | null;
  stage_metrics: Record<string, Record<string, unknown>>;
  summary_metrics: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProcessingDetails = {
  document_id: string;
  processing_status: ProcessingStatus;
  processing_error: string | null;
  processing_error_code: string | null;
  processing_error_stage: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  latest_run: ProcessingRun | null;
};

export type DocumentExtractionItem = {
  id: string;
  document_id: string;
  document_filename: string;
  type: ExtractionItemType;
  value_json: Record<string, unknown>;
  confidence: number | null;
  source: string;
  evidence_text: string | null;
  page_start: number | null;
  page_end: number | null;
  char_start: number | null;
  char_end: number | null;
  created_at: string;
};

export type DocumentExtractionItemListResponse = {
  items: DocumentExtractionItem[];
  total: number;
  limit: number;
  offset: number;
};

export type UserListResponse = {
  items: User[];
  total: number;
  limit: number;
  offset: number;
};
