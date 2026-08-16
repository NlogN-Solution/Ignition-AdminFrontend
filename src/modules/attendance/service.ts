import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  AttendanceDashboardSummary,
  AttendanceEmployeeSummary,
  AttendanceListParams,
  AttendancePolicy,
  AttendancePolicyUpdatePayload,
  AttendanceRecord,
  AttendanceRecordUpdatePayload,
} from "./types";

export const attendanceService = {
  async getPolicy(): Promise<AttendancePolicy | null> {
    try {
      const { data } = await apiClient.get<AttendancePolicy>("/attendance/policy");
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },

  async updatePolicy(payload: AttendancePolicyUpdatePayload): Promise<AttendancePolicy> {
    const { data } = await apiClient.patch<AttendancePolicy>("/attendance/policy", payload);
    return data;
  },

  async checkIn(): Promise<AttendanceRecord> {
    const { data } = await apiClient.post<AttendanceRecord>("/attendance/check-in");
    return data;
  },

  async checkOut(): Promise<AttendanceRecord> {
    const { data } = await apiClient.post<AttendanceRecord>("/attendance/check-out");
    return data;
  },

  async getToday(): Promise<AttendanceRecord | null> {
    const { data } = await apiClient.get<AttendanceRecord | null>("/attendance/today");
    return data;
  },

  async list(params: AttendanceListParams): Promise<ListResponse<AttendanceRecord>> {
    const { data } = await apiClient.get<ListResponse<AttendanceRecord>>("/attendance", { params });
    return data;
  },

  async update(id: string, payload: AttendanceRecordUpdatePayload): Promise<AttendanceRecord> {
    const { data } = await apiClient.patch<AttendanceRecord>(`/attendance/${id}`, payload);
    return data;
  },

  async getDashboard(targetDate?: string): Promise<AttendanceDashboardSummary> {
    const { data } = await apiClient.get<AttendanceDashboardSummary>("/attendance/dashboard", {
      params: targetDate ? { target_date: targetDate } : undefined,
    });
    return data;
  },

  async getEmployeeSummary(employeeId: string, year?: number, month?: number): Promise<AttendanceEmployeeSummary> {
    const { data } = await apiClient.get<AttendanceEmployeeSummary>(`/attendance/employees/${employeeId}/summary`, {
      params: { year, month },
    });
    return data;
  },
};
