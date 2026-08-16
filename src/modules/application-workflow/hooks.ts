import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { applicationWorkflowService } from "./service";
import type { UpdateWorkflowStepPayload, WorkflowStepListParams } from "./types";

const keys = {
  detail: (applicationId: string) => ["application-workflow", applicationId] as const,
  activities: (applicationId: string, stepId: string) => ["application-workflow", applicationId, "activities", stepId] as const,
  steps: (params: WorkflowStepListParams) => ["workflow-steps", params] as const,
};

export function useApplicationWorkflow(applicationId: string | undefined) {
  return useQuery({
    queryKey: keys.detail(applicationId ?? ""),
    queryFn: () => applicationWorkflowService.get(applicationId as string),
    enabled: Boolean(applicationId),
  });
}

export function useStartApplicationWorkflow(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId?: string) => applicationWorkflowService.start(applicationId, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.detail(applicationId) });
      toast.success("Journey started");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't start the workflow")),
  });
}

export function useUpdateWorkflowStep(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, payload }: { stepId: string; payload: UpdateWorkflowStepPayload }) =>
      applicationWorkflowService.updateStep(applicationId, stepId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.detail(applicationId) });
      queryClient.invalidateQueries({ queryKey: ["application-workflow", applicationId, "activities"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update this step")),
  });
}

export function useWorkflowStepActivities(applicationId: string, stepId: string | undefined) {
  return useQuery({
    queryKey: keys.activities(applicationId, stepId ?? ""),
    queryFn: () => applicationWorkflowService.listActivities(applicationId, stepId as string),
    enabled: Boolean(stepId),
  });
}

export function useAddStepComment(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment: string }) =>
      applicationWorkflowService.addComment(applicationId, stepId, comment),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.activities(applicationId, variables.stepId) });
      toast.success("Comment added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add comment")),
  });
}

export function useWorkflowSteps(params: WorkflowStepListParams) {
  return useQuery({
    queryKey: keys.steps(params),
    queryFn: () => applicationWorkflowService.listSteps(params),
    placeholderData: (prev) => prev,
  });
}
