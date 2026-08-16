import type { ChecklistItemStatus, DocumentType } from "@/types/enums";

export interface ApplicationChecklistItemRead {
  id: string;
  application_id: string;
  stage_id: string | null;
  document_type: DocumentType | null;
  custom_label: string | null;
  is_required: boolean;
  status: ChecklistItemStatus;
  document_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationChecklistItemCreatePayload {
  stage_id?: string | null;
  document_type?: DocumentType | null;
  custom_label?: string | null;
  is_required?: boolean;
  notes?: string | null;
}

export interface ApplicationChecklistItemUpdatePayload {
  status?: ChecklistItemStatus;
  document_id?: string | null;
  notes?: string | null;
  is_required?: boolean;
}
