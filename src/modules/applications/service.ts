import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  ApplicationCreatePayload,
  ApplicationListParams,
  ApplicationRead,
  ApplicationStatusHistoryRead,
  ApplicationUpdatePayload,
  StatusRequirement,
} from "./types";

export const applicationService = {
  async list(params: ApplicationListParams): Promise<ListResponse<ApplicationRead>> {
    const { data } = await apiClient.get<ListResponse<ApplicationRead>>("/applications", { params });
    return data;
  },

  async get(id: string): Promise<ApplicationRead> {
    const { data } = await apiClient.get<ApplicationRead>(`/applications/${id}`);
    return data;
  },

  async statusHistory(id: string): Promise<ApplicationStatusHistoryRead[]> {
    const { data } = await apiClient.get<ApplicationStatusHistoryRead[]>(`/applications/${id}/status-history`);
    return data;
  },

  async create(payload: ApplicationCreatePayload): Promise<ApplicationRead> {
    const { data } = await apiClient.post<ApplicationRead>("/applications", payload);
    return data;
  },

  async update(id: string, payload: ApplicationUpdatePayload): Promise<ApplicationRead> {
    const { data } = await apiClient.patch<ApplicationRead>(`/applications/${id}`, payload);
    return data;
  },

  /**
   * What each milestone status needs before it can be recorded.
   *
   * Fetched rather than restated in TypeScript so the dialog and the validator
   * read one config. A requirement added on the backend appears in the form
   * with no change here.
   */
  async statusRequirements(): Promise<StatusRequirement[]> {
    const { data } = await apiClient.get<StatusRequirement[]>("/applications/status-requirements");
    return data;
  },

  /**
   * Record an offer, a CAS or a visa decision — status, date and letter in one
   * request.
   *
   * Multipart, and a different endpoint from `changeStatus`, because these
   * statuses are not the application's own progress but something a university
   * issued. The backend refuses them on the plain status route for exactly that
   * reason: the old dropdown produced `offer_received` with no date and no
   * letter, and the student's portal showed a green badge with nothing behind it.
   */
  async recordMilestone(
    id: string,
    payload: { status: string; remarks?: string; letter?: File | null; fields: Record<string, string> },
  ): Promise<ApplicationRead> {
    const form = new FormData();
    form.append("status", payload.status);
    if (payload.remarks) form.append("remarks", payload.remarks);
    for (const [key, value] of Object.entries(payload.fields)) {
      if (value !== "" && value !== undefined && value !== null) form.append(key, value);
    }
    if (payload.letter) form.append("letter", payload.letter);

    const { data } = await apiClient.post<ApplicationRead>(`/applications/${id}/milestone`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async changeStatus(id: string, status: string, remarks?: string): Promise<ApplicationRead> {
    const { data } = await apiClient.post<ApplicationRead>(`/applications/${id}/status`, { status, remarks });
    return data;
  },

  async remove(id: string): Promise<ApplicationRead> {
    const { data } = await apiClient.delete<ApplicationRead>(`/applications/${id}`);
    return data;
  },
};
