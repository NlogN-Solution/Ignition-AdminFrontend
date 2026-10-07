import type { ChecklistItemStatus, DocumentType, WorkflowStepStatus } from "@/types/enums";

/** Mirrors `backend/app/schemas/journey.py`. */

export type StageKind = "info" | "documents" | "issued" | "review" | "booking" | "checklist";
export type SubmissionStatus = "submitted" | "verified" | "changes_requested";
export type SlotStatus = "open" | "booked" | "withdrawn" | "completed";
export type SlotOutcome = "passed" | "reschedule" | "failed";

export interface JourneyResource {
  title: string;
  description?: string;
  url?: string;
}

export interface JourneyTask {
  key: string;
  label: string;
}

/** Stage settings. Every key is optional; which apply depends on the kind. */
export interface StageConfig {
  on_complete_status?: string;
  on_fail_status?: string;
  milestone_status?: string;
  level_aware?: boolean;
  resources?: JourneyResource[];
  allow_text?: boolean;
  allow_document?: boolean;
  allow_link?: boolean;
  accept?: "document" | "video";
  allow_reschedule?: boolean;
  fail_ends_journey?: boolean;
  appointment_type?: string;
  tasks?: JourneyTask[];
  [key: string]: unknown;
}

export interface JourneyChecklistItem {
  id: string;
  document_type: DocumentType | null;
  custom_label: string | null;
  is_required: boolean;
  status: ChecklistItemStatus;
  document_id: string | null;
  notes: string | null;
}

export interface JourneySubmission {
  id: string;
  round: number;
  body_text: string | null;
  document_id: string | null;
  document_name: string | null;
  external_url: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  feedback_document_ids: string[];
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface JourneySlot {
  id: string;
  attempt: number;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  meeting_link: string | null;
  status: SlotStatus;
  outcome: SlotOutcome | null;
  outcome_note: string | null;
  appointment_id: string | null;
  booked_at: string | null;
}

export interface JourneyStep {
  id: string;
  stage_id: string | null;
  key: string | null;
  name: string;
  description: string | null;
  kind: StageKind;
  config: StageConfig;
  status: WorkflowStepStatus;
  order: number;
  started_at: string | null;
  completed_at: string | null;
  progress: { submitted_at?: string; tasks?: Record<string, string> };
  checklist: JourneyChecklistItem[];
  submissions: JourneySubmission[];
  slots: JourneySlot[];
  waiting_on: "student" | "staff" | null;
  notes: string | null;
  assigned_to: string | null;
}

export interface Journey {
  application_id: string;
  workflow_id: string;
  template_id: string;
  template_name: string;
  status: "active" | "completed" | "cancelled";
  study_level: "ug" | "pg";
  has_study_gap: boolean;
  current_step_id: string | null;
  progress_percent: number;
  steps: JourneyStep[];
}

export interface SlotInput {
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  meeting_link?: string | null;
}

export interface ReviewInput {
  verdict: "verified" | "changes_requested";
  feedback?: string | null;
  attachment_ids?: string[];
}

/** A journey worth drawing: one with at least one stage the portal acts on. */
export function isInteractive(journey: Journey | null | undefined): boolean {
  return Boolean(journey?.steps.some((step) => step.kind !== "info"));
}
