import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { appointmentService } from "./service";
import type { AppointmentCreatePayload, AppointmentListParams, AppointmentUpdatePayload } from "./types";

export function useAppointments(params: AppointmentListParams) {
  return useQuery({
    queryKey: queryKeys.appointments.list(params),
    queryFn: () => appointmentService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id ?? ""),
    queryFn: () => appointmentService.get(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateAppointments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (payload: AppointmentCreatePayload) => appointmentService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Appointment booked");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't book appointment")),
  });
}

export function useUpdateAppointment(id: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (payload: AppointmentUpdatePayload) => appointmentService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Appointment updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update appointment")),
  });
}

export function useDeleteAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (id: string) => appointmentService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Appointment cancelled");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't cancel appointment")),
  });
}
