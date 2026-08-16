import type { ApplicationWorkflowStatus, WorkflowActivityType, WorkflowStepStatus } from "@/types/enums";

export interface ApplicationWorkflowStepRead {
  id: string;
  application_workflow_id: string;
  stage_id: string | null;
  stage_name_snapshot: string;
  status: WorkflowStepStatus;
  assigned_to: string | null;
  updated_by: string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWorkflowRead {
  id: string;
  application_id: string;
  template_id: string;
  status: ApplicationWorkflowStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  steps: ApplicationWorkflowStepRead[];
}

export interface WorkflowStepActivityRead {
  id: string;
  step_id: string;
  activity_type: WorkflowActivityType;
  performed_by: string | null;
  old_status: WorkflowStepStatus | null;
  new_status: WorkflowStepStatus | null;
  comment: string | null;
  created_at: string;
}

export interface UpdateWorkflowStepPayload {
  status?: WorkflowStepStatus;
  assigned_to?: string | null;
  notes?: string | null;
}

export interface WorkflowStepListItem {
  id: string;
  application_id: string;
  application_workflow_id: string;
  template_id: string;
  stage_id: string | null;
  stage_key: string | null;
  stage_name_snapshot: string;
  status: WorkflowStepStatus;
  assigned_to: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepListParams {
  page?: number;
  limit?: number;
  stage_id?: string;
  status?: WorkflowStepStatus;
  template_id?: string;
  assigned_to?: string;
  application_id?: string;
}
