import type { AppointmentStatus, AppointmentType } from "@/types/enums";

export interface AppointmentRead {
  id: string;
  student_id: string;
  counsellor_id: string | null;
  attendee_ids: string[] | null;
  lead_id: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  title: string;
  description: string | null;
  preferred_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreatePayload {
  student_id?: string;
  counsellor_id?: string | null;
  attendee_ids?: string[] | null;
  lead_id?: string | null;
  appointment_type: AppointmentType;
  status?: AppointmentStatus;
  title: string;
  description?: string | null;
  preferred_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  notes?: string | null;
}

export type AppointmentUpdatePayload = Partial<AppointmentCreatePayload>;

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  student_id?: string;
  counsellor_id?: string;
  lead_id?: string;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  search?: string;
}
