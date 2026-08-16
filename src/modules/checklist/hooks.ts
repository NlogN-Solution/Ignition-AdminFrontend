import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { checklistService } from "./service";
import type { ApplicationChecklistItemCreatePayload, ApplicationChecklistItemUpdatePayload } from "./types";

const keys = {
  list: (applicationId: string) => ["checklist", applicationId] as const,
};

export function useChecklist(applicationId: string | undefined) {
  return useQuery({
    queryKey: keys.list(applicationId ?? ""),
    queryFn: () => checklistService.list(applicationId as string),
    enabled: Boolean(applicationId),
  });
}

export function useCreateChecklistItem(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplicationChecklistItemCreatePayload) => checklistService.create(applicationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(applicationId) });
      toast.success("Checklist item added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add item")),
  });
}

export function useUpdateChecklistItem(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: ApplicationChecklistItemUpdatePayload }) =>
      checklistService.update(applicationId, itemId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list(applicationId) }),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update item")),
  });
}
