import type { DegreeLevel } from "@/types/enums";

export interface CountryRead {
  id: string;
  name: string;
  iso2: string;
  iso3: string | null;
  phone_code: string | null;
  currency_code: string | null;
  flag_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryPayload {
  name: string;
  iso2: string;
  iso3?: string | null;
  phone_code?: string | null;
  currency_code?: string | null;
  flag_url?: string | null;
  is_active?: boolean;
}

export interface UniversityRead {
  id: string;
  country_id: string;
  name: string;
  short_name: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  ranking: number | null;
  is_partner: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UniversityPayload {
  country_id: string;
  name: string;
  short_name?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  /** Dropped from this payload until now, so the field could never be set. */
  logo_url?: string | null;
  ranking?: number | null;
  is_partner?: boolean;
  is_active?: boolean;
  acceptance_rate?: number | null;
  faculties?: string[] | null;
  highlights?: string[] | null;
  campus_type?: string | null;
}

export interface ProgramRead {
  id: string;
  university_id: string;
  name: string;
  degree_level: DegreeLevel | null;
  field_of_study: string | null;
  duration_months: number | null;
  tuition_fee: number | null;
  currency: string | null;
  intake: string | null;
  minimum_gpa: number | null;
  minimum_ielts: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramPayload {
  university_id: string;
  name: string;
  degree_level?: DegreeLevel | null;
  field_of_study?: string | null;
  duration_months?: number | null;
  tuition_fee?: number | null;
  currency?: string | null;
  is_active?: boolean;
  /**
   * These were all missing, so the form could read them but never write them.
   * Widened to match backend/app/schemas/academic.py `ProgramBase`.
   */
  intake?: string | null;
  minimum_gpa?: number | null;
  minimum_ielts?: number | null;
  intakes_summary?: string[] | null;
  highlights?: string[] | null;
  outcomes?: string[] | null;
  requirements?: Record<string, unknown> | null;
  key_dates?: Record<string, unknown> | null;
  course_type?: string | null;
  image_url?: string | null;
}

export interface IntakeRead {
  id: string;
  program_id: string;
  name: string;
  start_date: string | null;
  application_deadline: string | null;
  is_active: boolean;
  created_at: string;
}

export interface IntakePayload {
  program_id: string;
  name: string;
  start_date?: string | null;
  application_deadline?: string | null;
  is_active?: boolean;
}
