import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  ApplicationCreatePayload,
  ApplicationListParams,
  ApplicationRead,
  ApplicationStatusHistoryRead,
  ApplicationUpdatePayload,
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

  async changeStatus(id: string, status: string, remarks?: string): Promise<ApplicationRead> {
    const { data } = await apiClient.post<ApplicationRead>(`/applications/${id}/status`, { status, remarks });
    return data;
  },

  async remove(id: string): Promise<ApplicationRead> {
    const { data } = await apiClient.delete<ApplicationRead>(`/applications/${id}`);
    return data;
  },
};
