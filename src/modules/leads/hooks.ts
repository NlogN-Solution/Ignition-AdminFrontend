import { useMutation, useQuery, useQueryClient, type Query, type QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import type { LeadPriority } from "@/types/enums";
import type { ListResponse } from "@/types/api";
import { leadService } from "./service";
import type {
  LeadConvertPayload,
  LeadCreatePayload,
  LeadFollowUpCompletePayload,
  LeadFollowUpCreatePayload,
  LeadListParams,
  LeadMarkLostPayload,
  LeadRead,
  LeadUpdatePayload,
} from "./types";

export function useLeads(params: LeadListParams) {
  return useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: () => leadService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? ""),
    queryFn: () => leadService.get(id as string),
    enabled: Boolean(id),
    // A 404 is an answer, not a blip: retrying it only delays the redirect.
    retry: (failureCount, error) => !(isAxiosError(error) && error.response?.status === 404) && failureCount < 1,
  });
}

export function useLeadActivities(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leads.activities(id ?? ""),
    queryFn: () => leadService.activities(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    if (id) queryClient.invalidateQueries({ queryKey: queryKeys.leads.activities(id) });
  };
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (payload: LeadCreatePayload) => leadService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Lead created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create lead")),
  });
}

export function useUpdateLead(id: string) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (payload: LeadUpdatePayload) => leadService.update(id, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Lead updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update lead")),
  });
}

export function useAssignLead(id: string) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (assignedTo: string) => leadService.assign(id, assignedTo),
    onSuccess: () => {
      invalidate(id);
      toast.success("Lead assigned");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't assign lead")),
  });
}

export function useChangeLeadStatus(id: string) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ status, remarks }: { status: string; remarks?: string }) => leadService.changeStatus(id, status, remarks),
    onSuccess: () => {
      invalidate(id);
      toast.success("Status updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update status")),
  });
}

export function useQualifyLead(id: string) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (remarks?: string) => leadService.qualify(id, remarks),
    onSuccess: () => {
      invalidate(id);
      toast.success("Lead qualified — now a prospect");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't qualify lead")),
  });
}

export function useMarkLeadLost(id: string) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (payload: LeadMarkLostPayload) => leadService.markLost(id, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Lead marked lost");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't mark lead lost")),
  });
}

export function useConvertLead(id: string) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (payload: LeadConvertPayload) => leadService.convert(id, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Lead converted to client");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't convert lead")),
  });
}

/** Every cached query that is *about* one lead: its detail, activities, follow-ups, threads. */
const isAboutLead = (id: string) => (query: Query) => query.queryKey.includes(id);

/**
 * Forget a deleted lead entirely. Call it once nothing on screen is reading the
 * lead any more — i.e. after navigating away from its page — so no mounted
 * observer re-creates the query and fetches it again.
 */
export function forgetLead(queryClient: QueryClient, id: string) {
  queryClient.removeQueries({ predicate: isAboutLead(id) });
}

/**
 * Delete a lead.
 *
 * This used to invalidate everything under `["leads"]` — which includes the
 * deleted lead's own detail, activities and follow-ups. While its page was
 * still mounted, that fired a GET for each of them against a row that no longer
 * existed, and every one came back 404. So on success this:
 *
 *   - drops the lead from every cached list page straight away, so it leaves
 *     the table without waiting for a refetch;
 *   - cancels anything in flight for that lead, and refreshes every other
 *     lead query (lists, due follow-ups, counts) — but never the lead's own,
 *     which only has one possible answer now.
 *
 * The page that was showing the lead navigates away and then calls
 * `forgetLead` to clear what is left of it from the cache.
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadService.remove(id),
    onSuccess: async (_deleted, id) => {
      await queryClient.cancelQueries({ predicate: isAboutLead(id) });
      queryClient.setQueriesData<ListResponse<LeadRead>>({ queryKey: ["leads", "list"] }, (page) =>
        page && page.items.some((lead) => lead.id === id)
          ? { ...page, items: page.items.filter((lead) => lead.id !== id), total: Math.max(0, page.total - 1) }
          : page,
      );
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "leads" && !query.queryKey.includes(id),
      });
      toast.success("Lead deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete lead")),
  });
}

// --- Follow-ups -----------------------------------------------------------

export function useLeadFollowUps(leadId: string | undefined) {
  return useQuery({
    queryKey: ["leads", "follow-ups", leadId ?? ""],
    queryFn: () => leadService.listFollowUps(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useCreateFollowUp(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeadFollowUpCreatePayload) => leadService.createFollowUp(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", "follow-ups", leadId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.activities(leadId) });
      toast.success("Follow-up scheduled");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't schedule follow-up")),
  });
}

export function useCompleteFollowUp(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followUpId, payload }: { followUpId: string; payload: LeadFollowUpCompletePayload }) =>
      leadService.completeFollowUp(leadId, followUpId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", "follow-ups", leadId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.activities(leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      toast.success("Follow-up completed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't complete follow-up")),
  });
}

export function useDueFollowUps(params: { page?: number; limit?: number; counsellor_id?: string } = {}) {
  return useQuery({
    queryKey: ["leads", "follow-ups", "due", params],
    queryFn: () => leadService.listDueFollowUps(params),
  });
}

/**
 * Edits made from a row of the list, where the id is not known until the click.
 *
 * The hooks above each close over one `id`, which is right for a detail page
 * and unusable in a table cell — you cannot call `useUpdateLead(row.id)` per
 * row without breaking the rules of hooks. These take the id at mutate time
 * instead, so one instance serves every row on the page.
 *
 * Deliberately three mutations rather than one: they hit three different
 * endpoints (`PATCH /leads/{id}`, `POST /leads/{id}/status`,
 * `POST /leads/{id}/assign`), status writes an activity row and assignment
 * notifies, and collapsing them would hide that from the caller.
 */
export function useLeadRowEdits() {
  const invalidate = useInvalidateLeads();

  const status = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leadService.changeStatus(id, status),
    onSuccess: (_data, { id }) => {
      invalidate(id);
      toast.success("Lifecycle updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the lifecycle")),
  });

  const priority = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: LeadPriority }) =>
      leadService.update(id, { priority }),
    onSuccess: (_data, { id }) => {
      invalidate(id);
      toast.success("Priority updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update the priority")),
  });

  const owner = useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      leadService.assign(id, assignedTo),
    onSuccess: (_data, { id }) => {
      invalidate(id);
      toast.success("Lead assigned");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't assign the lead")),
  });

  return { status, priority, owner };
}
