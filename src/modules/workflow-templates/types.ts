import type { DocumentType } from "@/types/enums";

export interface WorkflowStageDocumentRequirementRead {
  id: string;
  stage_id: string;
  document_type: DocumentType | null;
  custom_label: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStageDocumentRequirementPayload {
  document_type?: DocumentType | null;
  custom_label?: string | null;
  is_required?: boolean;
}

export interface WorkflowStageRead {
  id: string;
  template_id: string;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  document_requirements: WorkflowStageDocumentRequirementRead[];
}

export interface WorkflowStagePayload {
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

export interface WorkflowTemplateRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country_id: string | null;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  stage_count: number;
}

export interface WorkflowTemplateDetailRead extends WorkflowTemplateRead {
  stages: WorkflowStageRead[];
}

export interface WorkflowTemplatePayload {
  name: string;
  slug?: string | null;
  description?: string | null;
  country_id?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

export interface WorkflowTemplateListParams {
  page?: number;
  limit?: number;
  search?: string;
  country_id?: string;
  is_active?: boolean;
}

export const STAGE_ICON_PRESETS = [
  "UserPlus",
  "FileText",
  "Inbox",
  "FileCheck",
  "ListChecks",
  "Send",
  "SendHorizontal",
  "Search",
  "CalendarClock",
  "CalendarCheck",
  "Award",
  "CheckCircle2",
  "Wallet",
  "FileSignature",
  "Plane",
  "PlaneTakeoff",
  "ShieldCheck",
  "Stethoscope",
  "Fingerprint",
  "Luggage",
  "MapPin",
  "PartyPopper",
  "Flag",
  "Star",
] as const;

export const STAGE_COLOR_PRESETS = [
  { label: "Slate", value: "#6B7280" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Violet", value: "#8B5CF6" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Green", value: "#10B981" },
  { label: "Red", value: "#EF4444" },
] as const;
