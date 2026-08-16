import type {
  ConversionSource,
  FollowUpMethod,
  FollowUpOutcome,
  LeadActivityType,
  LeadPriority,
  LeadSource,
  LeadStatus,
  LostReason,
} from "@/types/enums";

export interface LeadRead {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  interested_country: string | null;
  interested_course: string | null;
  preferred_intake: string | null;
  tags: string[] | null;
  assigned_to: string | null;
  remarks: string | null;
  next_follow_up_at: string | null;
  converted_user_id: string | null;
  qualified_by: string | null;
  qualified_at: string | null;
  converted_by: string | null;
  converted_at: string | null;
  conversion_source: ConversionSource | null;
  lost_reason: LostReason | null;
  lost_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCreatePayload {
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone: string;
  source?: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
  interested_country?: string | null;
  interested_course?: string | null;
  preferred_intake?: string | null;
  tags?: string[] | null;
  assigned_to?: string | null;
  remarks?: string | null;
  next_follow_up_at?: string | null;
}

export type LeadUpdatePayload = Partial<LeadCreatePayload>;

export interface LeadListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadStatus;
  statuses?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  assigned_to?: string;
  exclude_status?: LeadStatus;
}

export interface LeadActivityRead {
  id: string;
  lead_id: string;
  activity_type: LeadActivityType;
  performed_by: string | null;
  title: string | null;
  description: string | null;
  old_status: LeadStatus | null;
  new_status: LeadStatus | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface LeadConvertPayload {
  converted_user_id?: string;
  conversion_source?: ConversionSource;
  remarks?: string;
  create_portal_account?: boolean;
}

export interface LeadConvertResult {
  lead: LeadRead;
  created_new_user: boolean;
  student_user_id: string | null;
  portal_account_created: boolean;
  generated_password: string | null;
}

export interface LeadMarkLostPayload {
  reason: LostReason;
  remarks?: string;
}

// --- Follow-ups --------------------------------------------------------

export interface LeadFollowUpRead {
  id: string;
  lead_id: string;
  attempt_number: number;
  scheduled_at: string;
  completed_at: string | null;
  counsellor_id: string | null;
  method: FollowUpMethod;
  outcome: FollowUpOutcome | null;
  notes: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadFollowUpCreatePayload {
  scheduled_at: string;
  method: FollowUpMethod;
  counsellor_id?: string;
  notes?: string;
}

export interface LeadFollowUpCompletePayload {
  outcome: FollowUpOutcome;
  notes?: string;
  next_follow_up_at?: string;
  completed_at?: string;
}

export interface DueFollowUpItem {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_priority: LeadPriority;
  assigned_to: string | null;
  attempt_number: number;
  scheduled_at: string;
  method: FollowUpMethod;
  counsellor_id: string | null;
}

export const MAX_FOLLOW_UP_ATTEMPTS = 7;

// --- Lifecycle grouping --------------------------------------------------
// The backend keeps the original 6-value LeadStatus enum; the "Raw Lead / Prospect /
// Client / Lost" lifecycle from the brief is a UI-level grouping on top of it —
// converting still flips status to "converted", it just then always gets excluded
// from the default Lead Management views (see LeadListParams.exclude_status).

export const RAW_LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "follow_up"] as LeadStatus[];
export const PROSPECT_STATUSES: LeadStatus[] = ["qualified"] as LeadStatus[];
export const LOST_STATUSES: LeadStatus[] = ["lost"] as LeadStatus[];

export type LeadLifecycleTab = "raw" | "prospect" | "lost";

export const LEAD_STATUS_PIPELINE: LeadStatus[] = ["new", "contacted", "follow_up", "qualified", "converted"] as LeadStatus[];
