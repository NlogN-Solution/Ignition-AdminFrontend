import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { priorityTaskService } from "./service";
import type { PriorityTaskCreatePayload, PriorityTaskUpdatePayload } from "./types";

export const priorityTaskKeys = {
  list: (studentId: string) => ["priority-tasks", studentId] as const,
};

export function usePriorityTasks(studentId: string | undefined) {
  return useQuery({
    queryKey: priorityTaskKeys.list(studentId ?? ""),
    queryFn: () => priorityTaskService.list(studentId as string),
    enabled: Boolean(studentId),
  });
}

function useInvalidate(studentId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: priorityTaskKeys.list(studentId) });
}

export function useCreatePriorityTask(studentId: string) {
  const invalidate = useInvalidate(studentId);
  return useMutation({
    mutationFn: (payload: PriorityTaskCreatePayload) => priorityTaskService.create(studentId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Task added — the student can see it on their dashboard");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add the task")),
  });
}

export function useUpdatePriorityTask(studentId: string) {
  const invalidate = useInvalidate(studentId);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriorityTaskUpdatePayload }) =>
      priorityTaskService.update(studentId, id, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the task")),
  });
}

export function useDeletePriorityTask(studentId: string) {
  const invalidate = useInvalidate(studentId);
  return useMutation({
    mutationFn: (id: string) => priorityTaskService.remove(studentId, id),
    onSuccess: () => {
      invalidate();
      toast.success("Task removed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove the task")),
  });
}
