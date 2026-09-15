import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type { Thread, ThreadCreatePayload, ThreadDetail, ThreadReplyPayload } from "./types";

/**
 * One correspondence store, four views.
 *
 * `forLead` and `forStudent` return the *same rows* for the same person — a
 * thread opened against a lead is still that person's thread after they
 * convert, resolved server-side through `leads.converted_user_id`. Nothing in
 * this client joins anything; that is deliberate, because a client-side join
 * is exactly how the two halves of a history drifted apart before.
 */
export const communicationService = {
  async inbox(params: { search?: string; unread_only?: boolean; page?: number; limit?: number }) {
    const { data } = await apiClient.get<ListResponse<Thread>>("/communication/threads", { params });
    return data;
  },

  async forLead(leadId: string): Promise<Thread[]> {
    const { data } = await apiClient.get<Thread[]>(`/communication/leads/${leadId}/threads`);
    return data;
  },

  async forStudent(studentId: string): Promise<Thread[]> {
    const { data } = await apiClient.get<Thread[]>(`/communication/students/${studentId}/threads`);
    return data;
  },

  async forApplication(applicationId: string): Promise<Thread[]> {
    const { data } = await apiClient.get<Thread[]>(
      `/communication/applications/${applicationId}/threads`,
    );
    return data;
  },

  async get(threadId: string): Promise<ThreadDetail> {
    const { data } = await apiClient.get<ThreadDetail>(`/communication/threads/${threadId}`);
    return data;
  },

  async create(payload: ThreadCreatePayload): Promise<ThreadDetail> {
    const { data } = await apiClient.post<ThreadDetail>("/communication/threads", payload);
    return data;
  },

  /** Multipart always — body, files and voice note are one outcome. */
  async reply(threadId: string, payload: ThreadReplyPayload) {
    const form = new FormData();
    form.append("body", payload.body);
    if (payload.body_html) form.append("body_html", payload.body_html);
    for (const file of payload.files ?? []) form.append("files", file);
    if (payload.voice) {
      form.append("voice", payload.voice.blob, payload.voice.name);
      form.append("voice_duration", String(Math.round(payload.voice.durationSeconds)));
    }
    const { data } = await apiClient.post(`/communication/threads/${threadId}/messages`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /**
   * A URL the browser can open for an attachment.
   *
   * Same reasoning as `documentService.link`: the attachment route is
   * authenticated and a `window.open` carries no bearer token.
   */
  async attachmentLink(attachmentId: string, disposition: "inline" | "attachment" = "inline") {
    const { data } = await apiClient.get<{ url: string; file_name: string }>(
      `/communication/attachments/${attachmentId}/link`,
      { params: { disposition } },
    );
    return data;
  },
};
