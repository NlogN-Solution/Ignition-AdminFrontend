import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  WorkflowStageDocumentRequirementPayload,
  WorkflowStageDocumentRequirementRead,
  WorkflowStagePayload,
  WorkflowStageRead,
  WorkflowTemplateDetailRead,
  WorkflowTemplateListParams,
  WorkflowTemplatePayload,
  WorkflowTemplateRead,
} from "./types";

export const workflowTemplateService = {
  async list(params: WorkflowTemplateListParams): Promise<ListResponse<WorkflowTemplateRead>> {
    const { data } = await apiClient.get<ListResponse<WorkflowTemplateRead>>("/workflow-templates", { params });
    return data;
  },
  async get(id: string): Promise<WorkflowTemplateDetailRead> {
    const { data } = await apiClient.get<WorkflowTemplateDetailRead>(`/workflow-templates/${id}`);
    return data;
  },
  async create(payload: WorkflowTemplatePayload): Promise<WorkflowTemplateRead> {
    const { data } = await apiClient.post<WorkflowTemplateRead>("/workflow-templates", payload);
    return data;
  },
  async update(id: string, payload: Partial<WorkflowTemplatePayload>): Promise<WorkflowTemplateRead> {
    const { data } = await apiClient.patch<WorkflowTemplateRead>(`/workflow-templates/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<WorkflowTemplateRead> {
    const { data } = await apiClient.delete<WorkflowTemplateRead>(`/workflow-templates/${id}`);
    return data;
  },
  async duplicate(id: string): Promise<WorkflowTemplateDetailRead> {
    const { data } = await apiClient.post<WorkflowTemplateDetailRead>(`/workflow-templates/${id}/duplicate`);
    return data;
  },

  async createStage(templateId: string, payload: WorkflowStagePayload): Promise<WorkflowStageRead> {
    const { data } = await apiClient.post<WorkflowStageRead>(`/workflow-templates/${templateId}/stages`, payload);
    return data;
  },
  async updateStage(templateId: string, stageId: string, payload: Partial<WorkflowStagePayload>): Promise<WorkflowStageRead> {
    const { data } = await apiClient.patch<WorkflowStageRead>(`/workflow-templates/${templateId}/stages/${stageId}`, payload);
    return data;
  },
  async removeStage(templateId: string, stageId: string): Promise<WorkflowStageRead> {
    const { data } = await apiClient.delete<WorkflowStageRead>(`/workflow-templates/${templateId}/stages/${stageId}`);
    return data;
  },
  async reorderStages(templateId: string, stageIds: string[]): Promise<WorkflowStageRead[]> {
    const { data } = await apiClient.post<WorkflowStageRead[]>(`/workflow-templates/${templateId}/stages/reorder`, {
      stage_ids: stageIds,
    });
    return data;
  },

  async createRequirement(
    templateId: string,
    stageId: string,
    payload: WorkflowStageDocumentRequirementPayload,
  ): Promise<WorkflowStageDocumentRequirementRead> {
    const { data } = await apiClient.post<WorkflowStageDocumentRequirementRead>(
      `/workflow-templates/${templateId}/stages/${stageId}/requirements`,
      payload,
    );
    return data;
  },
  async updateRequirement(
    templateId: string,
    stageId: string,
    requirementId: string,
    payload: Partial<WorkflowStageDocumentRequirementPayload>,
  ): Promise<WorkflowStageDocumentRequirementRead> {
    const { data } = await apiClient.patch<WorkflowStageDocumentRequirementRead>(
      `/workflow-templates/${templateId}/stages/${stageId}/requirements/${requirementId}`,
      payload,
    );
    return data;
  },
  async removeRequirement(templateId: string, stageId: string, requirementId: string): Promise<void> {
    await apiClient.delete(`/workflow-templates/${templateId}/stages/${stageId}/requirements/${requirementId}`);
  },
};
