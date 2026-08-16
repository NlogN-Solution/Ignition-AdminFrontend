import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  PayrollRun,
  PayrollRunGenerateResult,
  Payslip,
  PayslipLineItemCreatePayload,
  SalaryStructure,
  SalaryStructureUpsertPayload,
} from "./types";

export const salaryStructureService = {
  async get(userId: string): Promise<SalaryStructure | null> {
    try {
      const { data } = await apiClient.get<SalaryStructure>(`/salary-structures/${userId}`);
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },
  async upsert(userId: string, payload: SalaryStructureUpsertPayload): Promise<SalaryStructure> {
    const { data } = await apiClient.put<SalaryStructure>(`/salary-structures/${userId}`, payload);
    return data;
  },
};

export interface PayrollRunListParams {
  page?: number;
  limit?: number;
}

export const payrollRunService = {
  async list(params: PayrollRunListParams): Promise<ListResponse<PayrollRun>> {
    const { data } = await apiClient.get<ListResponse<PayrollRun>>("/payroll-runs", { params });
    return data;
  },
  async create(periodYear: number, periodMonth: number): Promise<PayrollRunGenerateResult> {
    const { data } = await apiClient.post<PayrollRunGenerateResult>("/payroll-runs", {
      period_year: periodYear,
      period_month: periodMonth,
    });
    return data;
  },
  async get(id: string): Promise<PayrollRun> {
    const { data } = await apiClient.get<PayrollRun>(`/payroll-runs/${id}`);
    return data;
  },
  async finalize(id: string): Promise<PayrollRun> {
    const { data } = await apiClient.post<PayrollRun>(`/payroll-runs/${id}/finalize`);
    return data;
  },
  async markPaid(id: string): Promise<PayrollRun> {
    const { data } = await apiClient.post<PayrollRun>(`/payroll-runs/${id}/mark-paid`);
    return data;
  },
  async listPayslips(id: string): Promise<{ items: Payslip[] }> {
    const { data } = await apiClient.get<{ items: Payslip[] }>(`/payroll-runs/${id}/payslips`);
    return data;
  },
};

export const payslipService = {
  async get(id: string): Promise<Payslip> {
    const { data } = await apiClient.get<Payslip>(`/payslips/${id}`);
    return data;
  },
  async addLineItem(payslipId: string, payload: PayslipLineItemCreatePayload): Promise<Payslip> {
    const { data } = await apiClient.post<Payslip>(`/payslips/${payslipId}/line-items`, payload);
    return data;
  },
  async removeLineItem(payslipId: string, itemId: string): Promise<Payslip> {
    const { data } = await apiClient.delete<Payslip>(`/payslips/${payslipId}/line-items/${itemId}`);
    return data;
  },
  async getEmployeeHistory(userId: string): Promise<{ items: Payslip[] }> {
    const { data } = await apiClient.get<{ items: Payslip[] }>(`/users/${userId}/payslips`);
    return data;
  },
};
