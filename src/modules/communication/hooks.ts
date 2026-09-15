import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/errors";
import { communicationService } from "./service";
import type { ThreadCreatePayload, ThreadReplyPayload } from "./types";

/**
 * Query keys nested under one root, so a reply invalidates every view of the
 * thread it changed — the inbox, the lead tab, the student tab and the
 * application tab are four reads of one store, and a stale one of them is how
 * a counsellor ends up replying twice.
 */
export const communicationKeys = {
  all: ["communication"] as const,
  inbox: (params: unknown) => ["communication", "inbox", params] as const,
  lead: (leadId: string) => ["communication", "lead", leadId] as const,
  student: (studentId: string) => ["communication", "student", studentId] as const,
  application: (applicationId: string) => ["communication", "application", applicationId] as const,
  thread: (threadId: string) => ["communication", "thread", threadId] as const,
};

export function useInbox(params: { search?: string; unread_only?: boolean; page?: number }) {
  return useQuery({
    queryKey: communicationKeys.inbox(params),
    queryFn: () => communicationService.inbox(params),
    // Polling rather than sockets: the brief says to use existing
    // infrastructure, and a mailbox is not a keystroke stream.
    refetchInterval: 20_000,
    placeholderData: (prev) => prev,
  });
}

export function useLeadThreads(leadId: string | undefined) {
  return useQuery({
    queryKey: communicationKeys.lead(leadId ?? ""),
    queryFn: () => communicationService.forLead(leadId as string),
    enabled: Boolean(leadId),
  });
}

export function useStudentThreads(studentId: string | undefined) {
  return useQuery({
    queryKey: communicationKeys.student(studentId ?? ""),
    queryFn: () => communicationService.forStudent(studentId as string),
    enabled: Boolean(studentId),
  });
}

export function useApplicationThreads(applicationId: string | undefined) {
  return useQuery({
    queryKey: communicationKeys.application(applicationId ?? ""),
    queryFn: () => communicationService.forApplication(applicationId as string),
    enabled: Boolean(applicationId),
  });
}

export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: communicationKeys.thread(threadId ?? ""),
    queryFn: () => communicationService.get(threadId as string),
    enabled: Boolean(threadId),
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ThreadCreatePayload) => communicationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationKeys.all });
      toast.success("Message sent");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't send that message")),
  });
}

export function useReplyToThread(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ThreadReplyPayload) => communicationService.reply(threadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communicationKeys.all });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't send that reply")),
  });
}

export async function openAttachment(
  attachmentId: string,
  disposition: "inline" | "attachment" = "inline",
) {
  // Opened synchronously then navigated, so the browser attributes the popup
  // to the click that started it. Same reasoning as `openDocumentFile`.
  const target = window.open("", "_blank", "noopener,noreferrer");
  try {
    const { url } = await communicationService.attachmentLink(attachmentId, disposition);
    if (target) target.location.href = url;
    else window.location.assign(url);
  } catch {
    target?.close();
    toast.error("Couldn't open that attachment");
  }
}
