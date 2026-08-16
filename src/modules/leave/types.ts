import type { LeaveStatus } from "@/types/enums";

export interface LeaveType {
  id: string;
  name: string;
  default_days_per_year: number;
  paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveTypeCreatePayload {
  name: string;
  default_days_per_year: number;
  paid: boolean;
}

export type LeaveTypeUpdatePayload = Partial<LeaveTypeCreatePayload>;

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  requested_days: number;
  reason: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestCreatePayload {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  file?: File;
}

export interface LeaveListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  status?: LeaveStatus;
  leave_type_id?: string;
}

export interface LeaveBalanceEntry {
  leave_type_id: string;
  leave_type_name: string;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveBalanceList {
  year: number;
  items: LeaveBalanceEntry[];
}
