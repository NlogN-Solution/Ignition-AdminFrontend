import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  DueFollowUpItem,
  LeadActivityRead,
  LeadConvertPayload,
  LeadConvertResult,
  LeadCreatePayload,
  LeadFollowUpCompletePayload,
  LeadFollowUpCreatePayload,
  LeadFollowUpRead,
  LeadListParams,
  LeadMarkLostPayload,
  LeadRead,
  LeadUpdatePayload,
} from "./types";

export const leadService = {
  async list(params: LeadListParams): Promise<ListResponse<LeadRead>> {
    const { data } = await apiClient.get<ListResponse<LeadRead>>("/leads", { params });
    return data;
  },

  async get(id: string): Promise<LeadRead> {
    const { data } = await apiClient.get<LeadRead>(`/leads/${id}`);
    return data;
  },

  async activities(id: string): Promise<LeadActivityRead[]> {
    const { data } = await apiClient.get<LeadActivityRead[]>(`/leads/${id}/activities`);
    return data;
  },

  async create(payload: LeadCreatePayload): Promise<LeadRead> {
    const { data } = await apiClient.post<LeadRead>("/leads", payload);
    return data;
  },

  async update(id: string, payload: LeadUpdatePayload): Promise<LeadRead> {
    const { data } = await apiClient.patch<LeadRead>(`/leads/${id}`, payload);
    return data;
  },

  async assign(id: string, assignedTo: string): Promise<LeadRead> {
    const { data } = await apiClient.post<LeadRead>(`/leads/${id}/assign`, { assigned_to: assignedTo });
    return data;
  },

  async changeStatus(id: string, status: string, remarks?: string): Promise<LeadRead> {
    const { data } = await apiClient.post<LeadRead>(`/leads/${id}/status`, { status, remarks });
    return data;
  },

  async qualify(id: string, remarks?: string): Promise<LeadRead> {
    const { data } = await apiClient.post<LeadRead>(`/leads/${id}/qualify`, { remarks });
    return data;
  },

  async markLost(id: string, payload: LeadMarkLostPayload): Promise<LeadRead> {
    const { data } = await apiClient.post<LeadRead>(`/leads/${id}/lost`, payload);
    return data;
  },

  async convert(id: string, payload: LeadConvertPayload): Promise<LeadConvertResult> {
    const { data } = await apiClient.post<LeadConvertResult>(`/leads/${id}/convert`, payload);
    return data;
  },

  async remove(id: string): Promise<LeadRead> {
    const { data } = await apiClient.delete<LeadRead>(`/leads/${id}`);
    return data;
  },

  // --- Follow-ups ---

  async listFollowUps(leadId: string): Promise<{ items: LeadFollowUpRead[]; total: number }> {
    const { data } = await apiClient.get<{ items: LeadFollowUpRead[]; total: number }>(`/leads/${leadId}/follow-ups`);
    return data;
  },

  async createFollowUp(leadId: string, payload: LeadFollowUpCreatePayload): Promise<LeadFollowUpRead> {
    const { data } = await apiClient.post<LeadFollowUpRead>(`/leads/${leadId}/follow-ups`, payload);
    return data;
  },

  async completeFollowUp(leadId: string, followUpId: string, payload: LeadFollowUpCompletePayload): Promise<LeadFollowUpRead> {
    const { data } = await apiClient.patch<LeadFollowUpRead>(`/leads/${leadId}/follow-ups/${followUpId}`, payload);
    return data;
  },

  async listDueFollowUps(params: { page?: number; limit?: number; counsellor_id?: string }): Promise<ListResponse<DueFollowUpItem>> {
    const { data } = await apiClient.get<ListResponse<DueFollowUpItem>>("/leads/follow-ups/due", { params });
    return data;
  },
};
