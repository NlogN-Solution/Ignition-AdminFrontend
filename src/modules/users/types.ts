import type { EmploymentEventType, EmploymentType, Gender, UserRole, UserStatus } from "@/types/enums";

export interface UserRead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  avatar_url: string | null;
  bio: string | null;
  must_change_password: boolean;
  has_portal_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSelfUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  deleted?: boolean;
}

export interface StaffDirectoryEntry {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface StaffDirectoryParams {
  search?: string;
  role?: UserRole;
  user_id?: string;
  limit?: number;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  status?: UserStatus;
  role?: UserRole;
}

export interface UserCreatePayload {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string | null;
}

export interface ResetPasswordResponse {
  user_id: string;
  generated_password: string;
}

export interface EmployeeProfileRead {
  id: string;
  user_id: string;
  employee_code: string | null;
  department: string | null;
  department_id: string | null;
  designation: string | null;
  joining_date: string | null;
  employment_status: string | null;
  employment_type: EmploymentType | null;
  office_location: string | null;
  probation_end_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  manager_id: string | null;
  department_name: string | null;
  created_at: string;
  updated_at: string;
}

export type EmployeeProfileUpsertPayload = Partial<
  Omit<EmployeeProfileRead, "id" | "user_id" | "created_at" | "updated_at" | "department_name">
>;

export interface EmployeeEmploymentEventRead {
  id: string;
  employee_profile_id: string;
  event_type: EmploymentEventType;
  description: string | null;
  changed_by: string | null;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface StudentProfileRead {
  id: string;
  user_id: string;
  nationality: string | null;
  passport_number: string | null;
  current_address: string | null;
  education_level: string;
  university_name: string | null;
  institution_name: string | null;
  graduation_year: number | null;
  gpa: number | null;
  preferred_country: string | null;
  preferred_program: string | null;
  preferred_intake: string | null;
  budget: number | null;
  notes: string | null;
  father_name: string | null;
  mother_name: string | null;
  birth_place: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentProfileUpsertPayload = Partial<Omit<StudentProfileRead, "id" | "user_id" | "created_at" | "updated_at">>;

export interface StudentEducationHistoryRead {
  id: string;
  student_profile_id: string;
  institution_name: string;
  degree_level: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  grade: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type StudentEducationHistoryPayload = Partial<
  Omit<StudentEducationHistoryRead, "id" | "student_profile_id" | "created_at" | "updated_at">
> & {
  institution_name: string;
};

export interface StudentWorkExperienceRead {
  id: string;
  student_profile_id: string;
  company_name: string;
  job_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentWorkExperiencePayload = Partial<
  Omit<StudentWorkExperienceRead, "id" | "student_profile_id" | "created_at" | "updated_at">
> & {
  company_name: string;
  job_title: string;
};
