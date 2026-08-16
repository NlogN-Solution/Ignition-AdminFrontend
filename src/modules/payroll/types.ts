import type { PayrollRunStatus, PayslipLineType } from "@/types/enums";

export interface SalaryStructure {
  id: string;
  user_id: string;
  basic_salary: number;
  currency: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryStructureUpsertPayload {
  basic_salary: number;
  currency?: string;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
}

export interface PayrollRun {
  id: string;
  period_year: number;
  period_month: number;
  status: PayrollRunStatus;
  generated_by: string | null;
  generated_at: string | null;
  finalized_by: string | null;
  finalized_at: string | null;
  paid_by: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollRunGenerateResult extends PayrollRun {
  skipped_employees: number;
}

export interface PayslipLineItem {
  id: string;
  payslip_id: string;
  type: PayslipLineType;
  label: string;
  amount: number;
  created_by: string | null;
  created_at: string;
}

export interface PayslipLineItemCreatePayload {
  type: PayslipLineType;
  label: string;
  amount: number;
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  user_id: string;
  basic_salary: number;
  currency: string;
  expected_work_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_days: number;
  attendance_deduction: number;
  additions_total: number;
  deductions_total: number;
  net_pay: number;
  run_status: PayrollRunStatus;
  run_period: string;
  line_items: PayslipLineItem[];
  created_at: string;
  updated_at: string;
}
