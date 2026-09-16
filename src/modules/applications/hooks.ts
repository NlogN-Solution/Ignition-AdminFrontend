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

/**
 * The milestone requirements, fetched once and cached hard.
 *
 * It is configuration, not data: it changes when the backend changes, never
 * during a session. `staleTime: Infinity` keeps the status dialog from
 * refetching it every time it opens.
 */
export function useStatusRequirements() {
  return useQuery({
    queryKey: ["applications", "status-requirements"],
    queryFn: () => applicationService.statusRequirements(),
    staleTime: Infinity,
  });
}

export function useRecordMilestone(id: string) {
  const invalidate = useInvalidateApplications();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof applicationService.recordMilestone>[1]) =>
      applicationService.recordMilestone(id, payload),
    onSuccess: () => {
      invalidate(id);
      // The milestone writes a document, a status-history row and a
      // notification as well as the application — so the documents list, the
      // checklist and the notification bell are all stale, not just this row.
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
      toast.success("Recorded — the applicant has been notified");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't record that")),
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

/**
 * A status change made from a row of the applications list.
 *
 * `useChangeApplicationStatus` closes over one id, which cannot work per row.
 * This takes the id at mutate time.
 *
 * It only ever reaches `POST /applications/{id}/status`, the plain path. The
 * milestone statuses — offer, CAS, visa decision — are refused there because
 * they need a date and a letter, and a table row is the wrong place to collect
 * either. The list disables those options and says why rather than firing a
 * request the backend will reject.
 */
export function useChangeApplicationStatusById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      applicationService.changeStatus(id, status),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.statusHistory(id) });
      toast.success("Stage updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the stage")),
  });
}

/** Accepting a student's request, from wherever it is offered. */
export function useAcceptApplicationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationService.acceptRequest(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.statusHistory(id) });
      toast.success("Request accepted — the application is now being prepared");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't accept the request")),
  });
}
