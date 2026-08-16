import type { ApplicationStatus } from "@/types/enums";

export interface ApplicationRead {
  id: string;
  student_id: string;
  program_id: string;
  counsellor_id: string | null;
  status: ApplicationStatus;
  application_date: string | null;
  submission_date: string | null;
  offer_received_date: string | null;
  visa_applied_date: string | null;
  visa_decision_date: string | null;
  enrollment_date: string | null;
  tuition_fee: number | null;
  scholarship_amount: number | null;
  university_application_id: string | null;
  intake_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreatePayload {
  student_id: string;
  program_id: string;
  counsellor_id?: string | null;
  status?: ApplicationStatus;
  application_date?: string | null;
  intake_id?: string | null;
  tuition_fee?: number | null;
  scholarship_amount?: number | null;
  remarks?: string | null;
}

export type ApplicationUpdatePayload = Partial<ApplicationCreatePayload> & {
  submission_date?: string | null;
  offer_received_date?: string | null;
  visa_applied_date?: string | null;
  visa_decision_date?: string | null;
  enrollment_date?: string | null;
  university_application_id?: string | null;
};

export interface ApplicationListParams {
  page?: number;
  limit?: number;
  student_id?: string;
  counsellor_id?: string;
  program_id?: string;
  status?: ApplicationStatus;
}

export interface ApplicationStatusHistoryRead {
  id: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by: string | null;
  remarks: string | null;
  created_at: string;
}

export const APPLICATION_STATUS_PIPELINE: ApplicationStatus[] = [
  "draft",
  "documents_pending",
  "ready_to_submit",
  "submitted",
  "under_review",
  "offer_received",
  "visa_processing",
  "enrolled",
] as ApplicationStatus[];
