import { apiClient, API_BASE_URL } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  DocumentExtractionResult,
  DocumentFolder,
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

  fileUrl(document: DocumentRead): string {
    return document.file_url.startsWith("http") ? document.file_url : `${API_BASE_URL}${document.file_url}`;
  },
};
