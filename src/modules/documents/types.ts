import type { DocumentStatus, DocumentType } from "@/types/enums";

export interface DocumentRead {
  id: string;
  student_id: string;
  uploaded_by: string | null;
  document_type: DocumentType;
  title: string | null;
  original_file_name: string;
  stored_file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  status: DocumentStatus;
  expiry_date: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListParams {
  page?: number;
  limit?: number;
  student_id?: string;
  uploaded_by?: string;
  status?: DocumentStatus;
  document_type?: DocumentType;
  search?: string;
}

export interface DocumentUploadPayload {
  student_id: string;
  document_type: DocumentType;
  file: File;
  title?: string;
  remarks?: string;
}

export interface DocumentUpdatePayload {
  status?: DocumentStatus;
  rejection_reason?: string | null;
  remarks?: string | null;
  title?: string | null;
}

export interface DocumentExtractionResult {
  configured: boolean;
  document_id: string;
  document_type: DocumentType;
  message: string;
  fields: Record<string, string>;
}

/** One row per student with at least one document — the folder the admin/counsellor UI browses. */
export interface DocumentFolder {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  document_count: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  total_size: number;
  last_updated: string;
}

export type DocumentFolderSort = "recent" | "name" | "count" | "pending";

export interface DocumentFolderListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: DocumentFolderSort;
}
