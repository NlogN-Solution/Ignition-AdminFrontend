import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  LeaveBalanceList,
  LeaveListParams,
  LeaveRequest,
  LeaveRequestCreatePayload,
  LeaveType,
  LeaveTypeCreatePayload,
  LeaveTypeUpdatePayload,
} from "./types";

export const leaveTypeService = {
  async list(): Promise<{ items: LeaveType[] }> {
    const { data } = await apiClient.get<{ items: LeaveType[] }>("/leave-types");
    return data;
  },
  async create(payload: LeaveTypeCreatePayload): Promise<LeaveType> {
    const { data } = await apiClient.post<LeaveType>("/leave-types", payload);
    return data;
  },
  async update(id: string, payload: LeaveTypeUpdatePayload): Promise<LeaveType> {
    const { data } = await apiClient.patch<LeaveType>(`/leave-types/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<LeaveType> {
    const { data } = await apiClient.delete<LeaveType>(`/leave-types/${id}`);
    return data;
  },
};

export const leaveRequestService = {
  async create(payload: LeaveRequestCreatePayload): Promise<LeaveRequest> {
    const form = new FormData();
    form.append("leave_type_id", payload.leave_type_id);
    form.append("start_date", payload.start_date);
    form.append("end_date", payload.end_date);
    if (payload.reason) form.append("reason", payload.reason);
    if (payload.file) form.append("file", payload.file);

    const { data } = await apiClient.post<LeaveRequest>("/leave-requests", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async list(params: LeaveListParams): Promise<ListResponse<LeaveRequest>> {
    const { data } = await apiClient.get<ListResponse<LeaveRequest>>("/leave-requests", { params });
    return data;
  },

  async get(id: string): Promise<LeaveRequest> {
    const { data } = await apiClient.get<LeaveRequest>(`/leave-requests/${id}`);
    return data;
  },

  async approve(id: string, notes?: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(`/leave-requests/${id}/approve`, { notes: notes || null });
    return data;
  },

  async reject(id: string, reason: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(`/leave-requests/${id}/reject`, { reason });
    return data;
  },

  async cancel(id: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(`/leave-requests/${id}/cancel`);
    return data;
  },

  async getBalance(employeeId: string, year?: number): Promise<LeaveBalanceList> {
    const { data } = await apiClient.get<LeaveBalanceList>(`/leave-requests/employees/${employeeId}/balance`, {
      params: year ? { year } : undefined,
    });
    return data;
  },
};
