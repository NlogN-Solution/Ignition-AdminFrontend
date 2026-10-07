import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { applicationJourneyService } from "./service";
import type { Journey, ReviewInput, SlotInput, SlotOutcome } from "./types";

export const journeyKeys = {
  detail: (applicationId: string) => ["application-journey", applicationId] as const,
};

export function useApplicationJourney(applicationId: string | undefined) {
  return useQuery({
    queryKey: journeyKeys.detail(applicationId ?? ""),
    queryFn: () => applicationJourneyService.get(applicationId as string),
    enabled: Boolean(applicationId),
  });
}

/**
 * Every journey action returns the whole journey, so it is written straight
 * into the cache. A journey action can also move the application's status, its
 * workflow steps and its appointments, so those are refetched too.
 */
function useJourneyMutation<TArgs>(
  applicationId: string,
  action: (args: TArgs) => Promise<Journey>,
  messages: { success?: string; error: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (journey) => {
      queryClient.setQueryData(journeyKeys.detail(applicationId), journey);
      queryClient.invalidateQueries({ queryKey: ["application-workflow", applicationId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      if (messages.success) toast.success(messages.success);
    },
    onError: (error) => toast.error(getErrorMessage(error, messages.error)),
  });
}

export function useReviewSubmission(applicationId: string) {
  return useJourneyMutation(
    applicationId,
    ({ submissionId, payload }: { submissionId: string; payload: ReviewInput }) =>
      applicationJourneyService.review(applicationId, submissionId, payload),
    { success: "Review saved", error: "Couldn't save the review" },
  );
}

export function usePublishSlots(applicationId: string) {
  return useJourneyMutation(
    applicationId,
    ({ stepId, slots }: { stepId: string; slots: SlotInput[] }) =>
      applicationJourneyService.publishSlots(applicationId, stepId, slots),
    { success: "Slots offered to the student", error: "Couldn't offer those slots" },
  );
}

export function useWithdrawSlot(applicationId: string) {
  return useJourneyMutation(
    applicationId,
    (slotId: string) => applicationJourneyService.withdrawSlot(applicationId, slotId),
    { success: "Slot withdrawn", error: "Couldn't withdraw the slot" },
  );
}

export function useRecordOutcome(applicationId: string) {
  return useJourneyMutation(
    applicationId,
    ({ slotId, outcome, note }: { slotId: string; outcome: SlotOutcome; note?: string }) =>
      applicationJourneyService.recordOutcome(applicationId, slotId, outcome, note),
    { success: "Outcome recorded", error: "Couldn't record the outcome" },
  );
}

export function useSwitchJourney(applicationId: string) {
  return useJourneyMutation(
    applicationId,
    (templateId?: string) => applicationJourneyService.switchTemplate(applicationId, templateId),
    { success: "Journey switched", error: "Couldn't switch the journey" },
  );
}
