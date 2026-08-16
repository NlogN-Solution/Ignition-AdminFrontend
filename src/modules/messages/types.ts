export interface MessageSenderSummary {
  id: string;
  full_name: string;
}

export interface MessageRead {
  id: string;
  is_from_student: boolean;
  body: string;
  is_read: boolean;
  created_at: string;
  sender: MessageSenderSummary | null;
}

export interface MessageList {
  items: MessageRead[];
  total: number;
  unread_count: number;
}

export interface MessageThreadSummary {
  student_id: string;
  student_name: string;
  last_message: string;
  last_message_from_student: boolean;
  last_message_at: string;
  unread_count: number;
}
