import { apiClient } from "@/services/apiClient";
import type { ApplicationChecklistItemCreatePayload, ApplicationChecklistItemRead, ApplicationChecklistItemUpdatePayload } from "./types";

export const checklistService = {
  async list(applicationId: string): Promise<ApplicationChecklistItemRead[]> {
    const { data } = await apiClient.get<ApplicationChecklistItemRead[]>(`/applications/${applicationId}/checklist`);
    return data;
  },
  async create(applicationId: string, payload: ApplicationChecklistItemCreatePayload): Promise<ApplicationChecklistItemRead> {
    const { data } = await apiClient.post<ApplicationChecklistItemRead>(`/applications/${applicationId}/checklist`, payload);
    return data;
  },
  async update(applicationId: string, itemId: string, payload: ApplicationChecklistItemUpdatePayload): Promise<ApplicationChecklistItemRead> {
    const { data } = await apiClient.patch<ApplicationChecklistItemRead>(`/applications/${applicationId}/checklist/${itemId}`, payload);
    return data;
  },
};
