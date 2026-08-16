import type { NotificationChannel, NotificationType } from "@/types/enums";

export interface NotificationRead {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  notification_type?: NotificationType;
  channel?: NotificationChannel;
  is_read?: boolean;
}
