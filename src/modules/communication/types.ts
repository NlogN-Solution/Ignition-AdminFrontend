export type ThreadVisibility = "shared" | "internal";
export type AttachmentKind = "file" | "image" | "voice";

export interface ThreadAttachment {
  id: string;
  kind: AttachmentKind;
  original_file_name: string;
  mime_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface ThreadMessage {
  id: string;
  author_id: string | null;
  author_name: string | null;
  is_from_student: boolean;
  body: string;
  body_html: string | null;
  read_at: string | null;
  created_at: string;
  attachments: ThreadAttachment[];
}

/**
 * Who the thread is with.
 *
 * `stage` is the honest label rather than something the console derives from
 * which id happens to be null — and "student (from lead)" is the one worth
 * reading, because it means this conversation started before the person had an
 * account and carried across. That continuity is the whole point of the model.
 */
export interface ThreadParticipant {
  student_id: string | null;
  lead_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  stage: string;
}

export interface Thread {
  id: string;
  subject: string;
  visibility: ThreadVisibility;
  application_id: string | null;
  participant: ThreadParticipant;
  last_message_at: string;
  last_message_preview: string | null;
  is_closed: boolean;
  unread_count: number;
  message_count: number;
  created_at: string;
}

export interface ThreadDetail extends Thread {
  messages: ThreadMessage[];
}

export interface ThreadCreatePayload {
  subject: string;
  body: string;
  body_html?: string | null;
  student_id?: string | null;
  lead_id?: string | null;
  application_id?: string | null;
  visibility?: ThreadVisibility;
}

export interface ThreadReplyPayload {
  body: string;
  body_html?: string | null;
  files?: File[];
  voice?: { blob: Blob; name: string; durationSeconds: number } | null;
}
