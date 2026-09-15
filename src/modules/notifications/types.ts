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
  /**
   * What the notification is about, and where pressing it goes.
   *
   * Written by the server — which is what knows which surface owns an entity —
   * so a client never has to parse the title to work out where to navigate.
   * Null on rows written before the columns existed; the type map in `Topbar`
   * is the fallback for those.
   */
  related_type: string | null;
  related_id: string | null;
  action_url: string | null;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  notification_type?: NotificationType;
  channel?: NotificationChannel;
  is_read?: boolean;
}
