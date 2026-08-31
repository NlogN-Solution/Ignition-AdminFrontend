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

/**
 * Research a student did on the public Ignition platform before they had an
 * account, carried across at sign-up and stored under
 * `StudentProfile.preferences.research`.
 *
 * The ids here are the public catalogue's slugs — "example-metropolitan",
 * "computer-science" — and are NOT this backend's program/university UUIDs.
 * Nothing may join on them. They exist so a counsellor can see what the
 * student was actually looking at when they decided to apply, and so the
 * labels render without a lookup.
 */
export interface StudentResearchCourse {
  id: string | null;
  title: string;
  qualification: string | null;
  subject: string | null;
}

export interface StudentResearchUniversity {
  id: string | null;
  name: string;
  city: string | null;
}

export interface StudentResearch {
  source: string;
  /**
   * Which catalogue the slugs below belong to. `live` means they resolve;
   * `example` means the handoff predates the catalogue import and its ids
   * name institutions that never existed.
   */
  catalogue?: "live" | "example";
  importedAt: string | null;
  researchedAt: string | null;
  stage: string | null;
  career: { id: string | null; title: string; match: number | null } | null;
  alsoMatched: { id: string | null; title: string; match: number | null }[];
  courses: StudentResearchCourse[];
  universities: StudentResearchUniversity[];
  compared: string[];
  budget: { annualTuition: number | null; monthlyLiving: number | null; currency: string } | null;
}

/**
 * The student portal's own onboarding blocks, opaque to the backend. Only the
 * fields staff actually read are typed; the rest stay unknown rather than
 * being guessed at.
 */
/** One shortlisted institution, resolved by the backend to a catalogue row. */
export interface ResearchUniversity {
  slug: string;
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  is_published: boolean;
  course_count: number;
}

export interface ResearchShortlist {
  catalogue: "live" | "example" | "none";
  universities: ResearchUniversity[];
  /** Slugs that did not resolve — a withdrawn record, or a pre-import handoff. */
  unresolved: string[];
}

export interface StudentProfilePreferences {
  research?: StudentResearch;
  intendedStudyArea?: string;
  destinations?: string | string[];
  studyMode?: string;
  feeStructure?: string;
  [key: string]: unknown;
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
  preferences: StudentProfilePreferences | null;
  created_at: string;
  updated_at: string;
}

/** `preferences` is excluded deliberately: it is the student's own space, and
 * the staff profile form has no field for it — allowing it here would make it
 * possible to blank a student's carried-over research with a partial save. */
export type StudentProfileUpsertPayload = Partial<
  Omit<StudentProfileRead, "id" | "user_id" | "created_at" | "updated_at" | "preferences">
>;

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
