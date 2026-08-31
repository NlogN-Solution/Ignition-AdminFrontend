import type { LeadStatus } from "@/types/enums";

/**
 * The eligibility submission, as `/eligibility-assessments` serves it.
 *
 * Note what is *not* here: no status setter, no assignee setter, no notes
 * field. A submission is a historical record — what someone said on a Tuesday
 * — and every mutable thing about working it lives on the lead it belongs to,
 * which is why `lead_id` is on every row. The detail page drives the existing
 * lead hooks with it rather than growing a parallel set.
 */

export type EligibilityIndicator =
  | "likely_meets"
  | "needs_review"
  | "insufficient_information";

export type EligibilityOverall =
  | "preliminary_likely_eligible"
  | "needs_counsellor_review"
  | "more_information_required";

export interface EligibilityContact {
  full_name: string;
  email: string | null;
  phone: string;
  country: string | null;
  preferred_contact_method: string | null;
}

export interface EligibilityUniversity {
  slug: string;
  name: string;
  city: string | null;
}

export interface EligibilityAssessmentRead {
  id: string;
  lead_id: string;
  contact: EligibilityContact;
  study_level: string | null;
  preferred_course: string | null;
  english_summary: string | null;
  academic_status: EligibilityIndicator;
  english_status: EligibilityIndicator;
  financial_status: EligibilityIndicator;
  document_status: EligibilityIndicator;
  overall_status: EligibilityOverall;
  document_readiness: number;
  lead_status: LeadStatus;
  assigned_to: string | null;
  assigned_to_name: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  submitted_at: string;
}

export interface EligibilityAssessmentDetail extends EligibilityAssessmentRead {
  user_id: string | null;
  education: Record<string, unknown>;
  english: Record<string, unknown>;
  course: Record<string, unknown>;
  finance: Record<string, unknown>;
  documents: Record<string, unknown>;
  preferred_location: string | null;
  preferred_universities: EligibilityUniversity[];
  /** Why the system said what it said, in the words it said them. */
  assessment_notes: string[];
  /** The ruleset in force when this was submitted. */
  assessment_version: string;
  source_page: string | null;
  message: string | null;
  consent_at: string | null;
}

export interface EligibilityStats {
  total: number;
  new: number;
  likely_eligible: number;
  needs_review: number;
  more_information_required: number;
  contacted: number;
  converted: number;
  unassigned: number;
}

export interface EligibilityListParams {
  page?: number;
  limit?: number;
  search?: string;
  overall_status?: string;
  lead_status?: string;
  assigned_to?: string;
  study_level?: string;
  unassigned?: boolean;
  sort?: string;
}

// --- Labels, in one place so the list and the detail page never disagree ----

export const OVERALL_LABELS: Record<EligibilityOverall, string> = {
  preliminary_likely_eligible: "Likely eligible",
  needs_counsellor_review: "Needs review",
  more_information_required: "More info required",
};

export const INDICATOR_LABELS: Record<EligibilityIndicator, string> = {
  likely_meets: "Likely meets requirements",
  needs_review: "Needs review",
  insufficient_information: "Insufficient information",
};

export const QUALIFICATION_LABELS: Record<string, string> = {
  plus_two: "+2 / A Levels",
  bachelors: "Bachelor's degree",
  masters: "Master's degree",
  diploma: "Diploma",
  other: "Other",
};

export const ENGLISH_LABELS: Record<string, string> = {
  ielts: "IELTS",
  pte: "PTE",
  toefl: "TOEFL",
  other_test: "Other test",
  moi: "Medium of instruction",
  not_taken: "Not taken yet",
};

export const FUNDING_LABELS: Record<string, string> = {
  family: "Family funded",
  loan: "Education loan",
  scholarship: "Scholarship",
  self: "Self-funded",
  combination: "Combination",
};

export const DOCUMENT_LABELS: Record<string, string> = {
  ready: "Ready",
  in_progress: "In progress",
  not_available: "Not yet",
  not_sure: "Not sure",
};

export const DOCUMENT_ITEMS = [
  { key: "academic", label: "Academic documents" },
  { key: "passport", label: "Passport" },
  { key: "english", label: "English evidence" },
  { key: "financial", label: "Financial documents" },
  { key: "personal", label: "Personal documents" },
] as const;
