import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { workflowTemplateService } from "./service";
import type {
  WorkflowStageDocumentRequirementPayload,
  WorkflowStagePayload,
  WorkflowTemplateListParams,
  WorkflowTemplatePayload,
} from "./types";

const keys = {
  list: (params: WorkflowTemplateListParams) => ["workflow-templates", "list", params] as const,
  detail: (id: string) => ["workflow-templates", "detail", id] as const,
};

export function useWorkflowTemplates(params: WorkflowTemplateListParams = {}) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => workflowTemplateService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useWorkflowTemplate(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? ""),
    queryFn: () => workflowTemplateService.get(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateTemplates(id?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
    if (id) queryClient.invalidateQueries({ queryKey: keys.detail(id) });
  };
}

export function useCreateWorkflowTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (payload: WorkflowTemplatePayload) => workflowTemplateService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Template created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create template")),
  });
}

export function useUpdateWorkflowTemplate(id: string) {
  const invalidate = useInvalidateTemplates(id);
  return useMutation({
    mutationFn: (payload: Partial<WorkflowTemplatePayload>) => workflowTemplateService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Template updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update template")),
  });
}

export function useDeleteWorkflowTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (id: string) => workflowTemplateService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Template deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete template")),
  });
}

export function useDuplicateWorkflowTemplate() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (id: string) => workflowTemplateService.duplicate(id),
    onSuccess: () => {
      invalidate();
      toast.success("Template duplicated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't duplicate template")),
  });
}

export function useCreateStage(templateId: string) {
  const invalidate = useInvalidateTemplates(templateId);
  return useMutation({
    mutationFn: (payload: WorkflowStagePayload) => workflowTemplateService.createStage(templateId, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add stage")),
  });
}

export function useUpdateStage(templateId: string) {
  const invalidate = useInvalidateTemplates(templateId);
  return useMutation({
    mutationFn: ({ stageId, payload }: { stageId: string; payload: Partial<WorkflowStagePayload> }) =>
      workflowTemplateService.updateStage(templateId, stageId, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update stage")),
  });
}

export function useDeleteStage(templateId: string) {
  const invalidate = useInvalidateTemplates(templateId);
  return useMutation({
    mutationFn: (stageId: string) => workflowTemplateService.removeStage(templateId, stageId),
    onSuccess: () => {
      invalidate();
      toast.success("Stage removed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove stage")),
  });
}

export function useReorderStages(templateId: string) {
  const invalidate = useInvalidateTemplates(templateId);
  return useMutation({
    mutationFn: (stageIds: string[]) => workflowTemplateService.reorderStages(templateId, stageIds),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't reorder stages")),
  });
}

export function useCreateRequirement(templateId: string) {
  const invalidate = useInvalidateTemplates(templateId);
  return useMutation({
    mutationFn: ({ stageId, payload }: { stageId: string; payload: WorkflowStageDocumentRequirementPayload }) =>
      workflowTemplateService.createRequirement(templateId, stageId, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add requirement")),
  });
}

export function useDeleteRequirement(templateId: string) {
  const invalidate = useInvalidateTemplates(templateId);
  return useMutation({
    mutationFn: ({ stageId, requirementId }: { stageId: string; requirementId: string }) =>
      workflowTemplateService.removeRequirement(templateId, stageId, requirementId),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove requirement")),
  });
}
