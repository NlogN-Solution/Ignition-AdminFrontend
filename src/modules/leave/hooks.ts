import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { leaveRequestService, leaveTypeService } from "./service";
import type { LeaveListParams, LeaveRequestCreatePayload, LeaveTypeCreatePayload, LeaveTypeUpdatePayload } from "./types";

export function useLeaveTypes() {
  return useQuery({
    queryKey: queryKeys.leaveTypes.all,
    queryFn: () => leaveTypeService.list(),
  });
}

function useInvalidateLeaveTypes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.leaveTypes.all });
}

export function useCreateLeaveType() {
  const invalidate = useInvalidateLeaveTypes();
  return useMutation({
    mutationFn: (payload: LeaveTypeCreatePayload) => leaveTypeService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Leave type created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create leave type")),
  });
}

export function useUpdateLeaveType(id: string) {
  const invalidate = useInvalidateLeaveTypes();
  return useMutation({
    mutationFn: (payload: LeaveTypeUpdatePayload) => leaveTypeService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Leave type updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update leave type")),
  });
}

export function useDeleteLeaveType() {
  const invalidate = useInvalidateLeaveTypes();
  return useMutation({
    mutationFn: (id: string) => leaveTypeService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Leave type deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete leave type")),
  });
}

function useInvalidateLeaveRequests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.leaveRequests.all });
}

export function useLeaveRequests(params: LeaveListParams) {
  return useQuery({
    queryKey: queryKeys.leaveRequests.list(params),
    queryFn: () => leaveRequestService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateLeaveRequest() {
  const invalidate = useInvalidateLeaveRequests();
  return useMutation({
    mutationFn: (payload: LeaveRequestCreatePayload) => leaveRequestService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Leave requested");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't submit leave request")),
  });
}

export function useApproveLeaveRequest() {
  const invalidate = useInvalidateLeaveRequests();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => leaveRequestService.approve(id, notes),
    onSuccess: () => {
      invalidate();
      // Approval marks the covered work days on_leave in AttendanceRecord.
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      toast.success("Leave request approved");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't approve leave request")),
  });
}

export function useRejectLeaveRequest() {
  const invalidate = useInvalidateLeaveRequests();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => leaveRequestService.reject(id, reason),
    onSuccess: () => {
      invalidate();
      toast.success("Leave request rejected");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't reject leave request")),
  });
}

export function useCancelLeaveRequest() {
  const invalidate = useInvalidateLeaveRequests();
  return useMutation({
    mutationFn: (id: string) => leaveRequestService.cancel(id),
    onSuccess: () => {
      invalidate();
      toast.success("Leave request cancelled");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't cancel leave request")),
  });
}

export function useLeaveBalance(employeeId: string | undefined, year?: number) {
  return useQuery({
    queryKey: queryKeys.leaveRequests.balance(employeeId ?? "", year),
    queryFn: () => leaveRequestService.getBalance(employeeId as string, year),
    enabled: Boolean(employeeId),
  });
}
