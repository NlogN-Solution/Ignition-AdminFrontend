import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  DocumentExtractionResult,
  DocumentFolder,
  DocumentLink,
  DocumentFolderListParams,
  DocumentListParams,
  DocumentRead,
  DocumentUpdatePayload,
  DocumentUploadPayload,
} from "./types";

export const documentService = {
  async list(params: DocumentListParams): Promise<ListResponse<DocumentRead>> {
    const { data } = await apiClient.get<ListResponse<DocumentRead>>("/documents", { params });
    return data;
  },

  async folders(params: DocumentFolderListParams): Promise<ListResponse<DocumentFolder>> {
    const { data } = await apiClient.get<ListResponse<DocumentFolder>>("/documents/folders", { params });
    return data;
  },

  async folder(studentId: string): Promise<DocumentFolder> {
    const { data } = await apiClient.get<DocumentFolder>(`/documents/folders/${studentId}`);
    return data;
  },

  async get(id: string): Promise<DocumentRead> {
    const { data } = await apiClient.get<DocumentRead>(`/documents/${id}`);
    return data;
  },

  async upload(payload: DocumentUploadPayload): Promise<DocumentRead> {
    const form = new FormData();
    form.append("student_id", payload.student_id);
    form.append("document_type", payload.document_type);
    form.append("file", payload.file);
    if (payload.title) form.append("title", payload.title);
    if (payload.remarks) form.append("remarks", payload.remarks);
    if (payload.application_id) form.append("application_id", payload.application_id);

    const { data } = await apiClient.post<DocumentRead>("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async update(id: string, payload: DocumentUpdatePayload): Promise<DocumentRead> {
    const { data } = await apiClient.patch<DocumentRead>(`/documents/${id}`, payload);
    return data;
  },

  async verify(id: string, remarks?: string): Promise<DocumentRead> {
    const { data } = await apiClient.post<DocumentRead>(`/documents/${id}/verify`, { remarks: remarks || null });
    return data;
  },

  async reject(id: string, reason: string, remarks?: string): Promise<DocumentRead> {
    const { data } = await apiClient.post<DocumentRead>(`/documents/${id}/reject`, { reason, remarks: remarks || null });
    return data;
  },

  async comment(id: string, remarks: string): Promise<DocumentRead> {
    const { data } = await apiClient.post<DocumentRead>(`/documents/${id}/comment`, { remarks });
    return data;
  },

  async extract(id: string): Promise<DocumentExtractionResult> {
    const { data } = await apiClient.post<DocumentExtractionResult>(`/documents/${id}/extract`);
    return data;
  },

  async remove(id: string): Promise<DocumentRead> {
    const { data } = await apiClient.delete<DocumentRead>(`/documents/${id}`);
    return data;
  },

  /**
   * A URL the browser can open for this document's file.
   *
   * There used to be a `fileUrl()` here that returned
   * `${API_BASE_URL}${document.file_url}`, and it was broken twice over.
   * `file_url` is already an absolute API path (`/api/v1/documents/…`) and
   * `API_BASE_URL` already ends in `/api/v1`, so the result was
   * `…/api/v1/api/v1/documents/…` — a 404. And even spelled correctly it would
   * have failed: that route is authenticated, and a `window.open` carries no
   * bearer token. So View and Download were both dead, in every documents list
   * in the console.
   *
   * This asks the backend over the authenticated client — where the token
   * is — for a signed, short-lived URL, and that is what gets opened.
   */
  async link(id: string, disposition: "inline" | "attachment" = "inline"): Promise<DocumentLink> {
    const { data } = await apiClient.get<DocumentLink>(`/documents/${id}/link`, { params: { disposition } });
    return data;
  },
};
