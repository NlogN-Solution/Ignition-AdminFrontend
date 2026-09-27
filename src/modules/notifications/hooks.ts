import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { notificationService } from "./service";
import type { ListResponse } from "@/types/api";
import type { NotificationListParams, NotificationRead } from "./types";

export function useNotifications(params: NotificationListParams = {}, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationService.list(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

/** Clears the bell. The cached lists are flipped to read straight away so the
 * badge disappears on click, then re-fetched to confirm. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: () => {
      for (const [key, current] of queryClient.getQueriesData<ListResponse<NotificationRead>>({
        queryKey: queryKeys.notifications.all,
      })) {
        if (!current) continue;
        const params = (key[2] ?? {}) as NotificationListParams;
        queryClient.setQueryData<ListResponse<NotificationRead>>(
          key,
          params.is_read === false
            ? { ...current, items: [], total: 0 }
            : { ...current, items: current.items.map((n) => ({ ...n, is_read: true })) },
        );
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useMarkNotificationUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markUnread(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
