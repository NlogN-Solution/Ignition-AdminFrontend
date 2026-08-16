import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { applicationService } from "./service";
import type { ApplicationCreatePayload, ApplicationListParams, ApplicationUpdatePayload } from "./types";

export function useApplications(params: ApplicationListParams) {
  return useQuery({
    queryKey: queryKeys.applications.list(params),
    queryFn: () => applicationService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id ?? ""),
    queryFn: () => applicationService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useApplicationStatusHistory(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.statusHistory(id ?? ""),
    queryFn: () => applicationService.statusHistory(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    if (id) queryClient.invalidateQueries({ queryKey: queryKeys.applications.statusHistory(id) });
  };
}

export function useCreateApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (payload: ApplicationCreatePayload) => applicationService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Application created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create application")),
  });
}

export function useUpdateApplication(id: string) {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (payload: ApplicationUpdatePayload) => applicationService.update(id, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Application updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update application")),
  });
}

export function useChangeApplicationStatus(id: string) {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({ status, remarks }: { status: string; remarks?: string }) => applicationService.changeStatus(id, status, remarks),
    onSuccess: () => {
      invalidate(id);
      toast.success("Status updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update status")),
  });
}

export function useDeleteApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: (id: string) => applicationService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Application deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete application")),
  });
}
