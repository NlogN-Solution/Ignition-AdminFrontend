import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { leadService } from "./service";
import type {
  LeadConvertPayload,
  LeadCreatePayload,
  LeadFollowUpCompletePayload,
  LeadFollowUpCreatePayload,
  LeadListParams,
  LeadMarkLostPayload,
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

export function useDeleteLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (id: string) => leadService.remove(id),
    onSuccess: () => {
      invalidate();
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
