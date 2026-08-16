import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { attendanceService } from "./service";
import type { AttendanceListParams, AttendancePolicyUpdatePayload, AttendanceRecordUpdatePayload } from "./types";

export function useAttendancePolicy() {
  return useQuery({
    queryKey: queryKeys.attendance.policy,
    queryFn: () => attendanceService.getPolicy(),
  });
}

export function useUpdateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendancePolicyUpdatePayload) => attendanceService.updatePolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.policy });
      toast.success("Attendance policy updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update attendance policy")),
  });
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: queryKeys.attendance.today,
    queryFn: () => attendanceService.getToday(),
  });
}

function useInvalidateAttendance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
}

export function useCheckIn() {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: () => {
      invalidate();
      toast.success("Checked in");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't check in")),
  });
}

export function useCheckOut() {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: () => {
      invalidate();
      toast.success("Checked out");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't check out")),
  });
}

export function useAttendanceList(params: AttendanceListParams) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params),
    queryFn: () => attendanceService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateAttendanceRecord() {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AttendanceRecordUpdatePayload }) => attendanceService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Attendance record updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update attendance record")),
  });
}

export function useAttendanceDashboard(targetDate?: string) {
  return useQuery({
    queryKey: queryKeys.attendance.dashboard(targetDate),
    queryFn: () => attendanceService.getDashboard(targetDate),
    placeholderData: (prev) => prev,
  });
}

export function useEmployeeAttendanceSummary(employeeId: string | undefined, year?: number, month?: number) {
  return useQuery({
    queryKey: queryKeys.attendance.employeeSummary(employeeId ?? "", year, month),
    queryFn: () => attendanceService.getEmployeeSummary(employeeId as string, year, month),
    enabled: Boolean(employeeId),
  });
}
