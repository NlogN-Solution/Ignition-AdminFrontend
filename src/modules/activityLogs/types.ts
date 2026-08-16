export const ActivityType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LOGIN: "login",
  LOGOUT: "logout",
  UPLOAD: "upload",
  DOWNLOAD: "download",
  ASSIGN: "assign",
  STATUS_CHANGE: "status_change",
  PAYMENT: "payment",
  IMPERSONATE: "impersonate",
  OTHER: "other",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export interface ActivityLogRead {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  activity_type: ActivityType;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ActivityLogListParams {
  page?: number;
  limit?: number;
  user_id?: string;
  activity_type?: ActivityType;
  entity_type?: string;
}
