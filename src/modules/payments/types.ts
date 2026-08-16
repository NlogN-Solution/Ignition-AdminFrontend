import type { PaymentMethod, PaymentStatus } from "@/types/enums";

export interface PaymentRead {
  id: string;
  student_id: string;
  application_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference: string | null;
  payment_date: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreatePayload {
  student_id: string;
  application_id?: string | null;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  status?: PaymentStatus;
  transaction_reference?: string | null;
  payment_date?: string | null;
  remarks?: string | null;
}

export type PaymentUpdatePayload = Partial<PaymentCreatePayload>;

export interface PaymentListParams {
  page?: number;
  limit?: number;
  student_id?: string;
  application_id?: string;
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
}
