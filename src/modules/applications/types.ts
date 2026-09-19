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
  cas_received_date: string | null;
  cas_number: string | null;
  offer_type: "conditional" | "unconditional" | "other" | null;
  tuition_fee: number | null;
  scholarship_amount: number | null;
  university_application_id: string | null;
  intake_id: string | null;
  remarks: string | null;
  /** Staff-set and shown to the student under "Key Deadlines". */
  application_deadline: string | null;
  payment_deadline: string | null;
  /** The date an offer's conditions must be met by — the student's "Please note". */
  condition_deadline: string | null;
  /** Staff-written, student-facing notice; one point per line. */
  student_notice: string | null;
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
  application_deadline?: string | null;
  payment_deadline?: string | null;
  condition_deadline?: string | null;
  student_notice?: string | null;
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


/**
 * What a milestone status needs, as served by
 * `GET /applications/status-requirements`.
 *
 * Mirrors `app/services/status_requirements.py`. Deliberately a fetched shape
 * rather than a hardcoded union: the whole point of the config living on the
 * backend is that one place decides what recording an offer requires.
 */
export interface StatusRequirement {
  status: string;
  prompt: string;
  required_date_field: string | null;
  required_document: string | null;
  document_label: string;
  optional_fields: string[];
  milestone: string | null;
}
