import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { messageService } from "./service";

export function useMessageThreads(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.messages.threads,
    queryFn: () => messageService.listThreads(),
    refetchInterval: options.refetchInterval,
  });
}

export function useMessageThread(studentId: string | null, options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.messages.thread(studentId ?? ""),
    queryFn: () => messageService.getThread(studentId as string),
    enabled: Boolean(studentId),
    refetchInterval: options.refetchInterval,
  });
}

export function useSendMessage(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messageService.send(studentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.threads });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't send that message")),
  });
}

export function useMarkThreadRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => messageService.markThreadRead(studentId),
    onSuccess: (_data, studentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.threads });
    },
  });
}
