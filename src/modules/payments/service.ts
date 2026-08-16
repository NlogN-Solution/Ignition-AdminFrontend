import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type { PaymentCreatePayload, PaymentListParams, PaymentRead, PaymentUpdatePayload } from "./types";

export const paymentService = {
  async list(params: PaymentListParams): Promise<ListResponse<PaymentRead>> {
    const { data } = await apiClient.get<ListResponse<PaymentRead>>("/payments", { params });
    return data;
  },
  async get(id: string): Promise<PaymentRead> {
    const { data } = await apiClient.get<PaymentRead>(`/payments/${id}`);
    return data;
  },
  async create(payload: PaymentCreatePayload): Promise<PaymentRead> {
    const { data } = await apiClient.post<PaymentRead>("/payments", payload);
    return data;
  },
  async update(id: string, payload: PaymentUpdatePayload): Promise<PaymentRead> {
    const { data } = await apiClient.patch<PaymentRead>(`/payments/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<PaymentRead> {
    const { data } = await apiClient.delete<PaymentRead>(`/payments/${id}`);
    return data;
  },
};
