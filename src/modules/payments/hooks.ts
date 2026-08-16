import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { paymentService } from "./service";
import type { PaymentCreatePayload, PaymentListParams, PaymentUpdatePayload } from "./types";

export function usePayments(params: PaymentListParams) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentService.list(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
}

export function useCreatePayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: (payload: PaymentCreatePayload) => paymentService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Payment recorded");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't record payment")),
  });
}

export function useUpdatePayment(id: string) {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: (payload: PaymentUpdatePayload) => paymentService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Payment updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update payment")),
  });
}

export function useDeletePayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: (id: string) => paymentService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Payment deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete payment")),
  });
}
