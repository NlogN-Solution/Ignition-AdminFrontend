import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type { NotificationListParams, NotificationRead } from "./types";

export const notificationService = {
  async list(params: NotificationListParams): Promise<ListResponse<NotificationRead>> {
    const { data } = await apiClient.get<ListResponse<NotificationRead>>("/notifications", { params });
    return data;
  },

  async markRead(id: string): Promise<NotificationRead> {
    const { data } = await apiClient.post<NotificationRead>(`/notifications/${id}/read`);
    return data;
  },

  async markUnread(id: string): Promise<NotificationRead> {
    const { data } = await apiClient.post<NotificationRead>(`/notifications/${id}/unread`);
    return data;
  },
};
