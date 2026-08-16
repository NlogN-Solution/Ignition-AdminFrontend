import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  ApplicationWorkflowRead,
  ApplicationWorkflowStepRead,
  UpdateWorkflowStepPayload,
  WorkflowStepActivityRead,
  WorkflowStepListItem,
  WorkflowStepListParams,
} from "./types";

export const applicationWorkflowService = {
  async get(applicationId: string): Promise<ApplicationWorkflowRead | null> {
    try {
      const { data } = await apiClient.get<ApplicationWorkflowRead>(`/applications/${applicationId}/workflow`);
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },

  async start(applicationId: string, templateId?: string): Promise<ApplicationWorkflowRead> {
    const { data } = await apiClient.post<ApplicationWorkflowRead>(`/applications/${applicationId}/workflow`, {
      template_id: templateId,
    });
    return data;
  },

  async updateStep(applicationId: string, stepId: string, payload: UpdateWorkflowStepPayload): Promise<ApplicationWorkflowStepRead> {
    const { data } = await apiClient.patch<ApplicationWorkflowStepRead>(
      `/applications/${applicationId}/workflow/steps/${stepId}`,
      payload,
    );
    return data;
  },

  async listActivities(applicationId: string, stepId: string): Promise<WorkflowStepActivityRead[]> {
    const { data } = await apiClient.get<WorkflowStepActivityRead[]>(
      `/applications/${applicationId}/workflow/steps/${stepId}/activities`,
    );
    return data;
  },

  async addComment(applicationId: string, stepId: string, comment: string): Promise<WorkflowStepActivityRead> {
    const { data } = await apiClient.post<WorkflowStepActivityRead>(
      `/applications/${applicationId}/workflow/steps/${stepId}/activities`,
      { comment },
    );
    return data;
  },

  async listSteps(params: WorkflowStepListParams): Promise<ListResponse<WorkflowStepListItem>> {
    const { data } = await apiClient.get<ListResponse<WorkflowStepListItem>>("/workflow-steps", { params });
    return data;
  },
};
