export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

// Every status/priority value across every enum in backend/app/models/enums.py, bucketed by
// what it visually communicates. Unmapped values fall back to "neutral" — never throws.
const TONE_MAP: Record<string, StatusTone> = {
  // neutral / early-stage
  new: "neutral",
  draft: "neutral",
  pending: "neutral",
  scheduled: "neutral",
  low: "neutral",

  // awaiting staff action
  requested: "warning",

  // in-progress / informational
  current: "info",
  contacted: "info",
  follow_up: "info",
  documents_pending: "info",
  ready_to_submit: "info",
  in_progress: "info",
  processing: "info",
  under_review: "info",
  confirmed: "info",
  uploaded: "info",
  visa_processing: "info",
  medium: "info",

  // positive / success
  qualified: "success",
  converted: "success",
  submitted: "success",
  offer_received: "success",
  offer_accepted: "success",
  visa_approved: "success",
  enrolled: "success",
  completed: "success",
  approved: "success",
  verified: "success",
  active: "success",
  paid: "success",
  finalized: "success",

  // needs attention
  high: "warning",
  urgent: "warning",
  rescheduled: "warning",

  // negative
  lost: "danger",
  offer_declined: "danger",
  visa_rejected: "danger",
  rejected: "danger",
  cancelled: "danger",
  failed: "danger",
  no_show: "danger",
  expired: "danger",
  suspended: "danger",
  withdrawn: "danger",
  inactive: "danger",
  refunded: "danger",
  terminated: "danger",

  // employment status
  on_leave: "info",

  // attendance
  present: "success",
  late: "warning",
  half_day: "warning",
  holiday: "neutral",
  absent: "danger",

  // workflow-specific: explicit, not just fallback, for readability
  skipped: "neutral",
  waived: "neutral",

  // follow-up outcomes
  no_answer: "neutral",
  busy: "neutral",
  call_back_later: "info",
  interested: "success",
  very_interested: "success",
  thinking: "info",
  wrong_number: "danger",
  not_eligible: "danger",
  duplicate: "danger",
  converted_to_prospect: "success",
  converted_to_client: "success",

  // lost reasons
  no_response_after_7_attempts: "danger",
  not_interested: "danger",
  budget_issue: "danger",
  chose_another_consultancy: "danger",
  invalid_lead: "danger",
  duplicate_lead: "danger",
};

export function toneForStatus(status: string): StatusTone {
  return TONE_MAP[status] ?? "neutral";
}
