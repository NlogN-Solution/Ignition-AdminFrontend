import type { AttendanceSource, AttendanceStatus } from "@/types/enums";

export interface AttendancePolicy {
  id: string;
  work_days: number[];
  expected_start_time: string;
  expected_end_time: string;
  grace_period_minutes: number;
  break_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AttendancePolicyUpdatePayload {
  work_days?: number[];
  expected_start_time?: string;
  expected_end_time?: string;
  grace_period_minutes?: number;
  break_minutes?: number;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  worked_seconds: number | null;
  overtime_seconds: number | null;
  status: AttendanceStatus;
  source: AttendanceSource;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordUpdatePayload {
  check_in_at?: string;
  check_out_at?: string;
  worked_seconds?: number;
  overtime_seconds?: number;
  status?: AttendanceStatus;
  notes?: string;
}

export interface AttendanceListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  department_id?: string;
  status?: AttendanceStatus;
  date_from?: string;
  date_to?: string;
}

export interface AttendanceDashboardSummary {
  date: string;
  is_work_day: boolean;
  present: number;
  late: number;
  currently_working: number;
  absent: number;
}

export interface AttendanceEmployeeSummary {
  year: number;
  month: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  total_worked_seconds: number;
}
