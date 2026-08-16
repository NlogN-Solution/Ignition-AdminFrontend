import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type { AppointmentCreatePayload, AppointmentListParams, AppointmentRead, AppointmentUpdatePayload } from "./types";

export const appointmentService = {
  async list(params: AppointmentListParams): Promise<ListResponse<AppointmentRead>> {
    const { data } = await apiClient.get<ListResponse<AppointmentRead>>("/appointments", { params });
    return data;
  },
  async get(id: string): Promise<AppointmentRead> {
    const { data } = await apiClient.get<AppointmentRead>(`/appointments/${id}`);
    return data;
  },
  async create(payload: AppointmentCreatePayload): Promise<AppointmentRead> {
    const { data } = await apiClient.post<AppointmentRead>("/appointments", payload);
    return data;
  },
  async update(id: string, payload: AppointmentUpdatePayload): Promise<AppointmentRead> {
    const { data } = await apiClient.patch<AppointmentRead>(`/appointments/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<AppointmentRead> {
    const { data } = await apiClient.delete<AppointmentRead>(`/appointments/${id}`);
    return data;
  },
};
