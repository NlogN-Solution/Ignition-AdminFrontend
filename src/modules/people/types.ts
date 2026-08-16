import type { EmploymentType, UserRole, UserStatus } from "@/types/enums";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DepartmentCreatePayload {
  name: string;
  description?: string | null;
  manager_id?: string | null;
}

export type DepartmentUpdatePayload = Partial<DepartmentCreatePayload>;

/** One row per staff user — left-joined against EmployeeProfile/Department, so
 * a staff account with no employee profile filled in yet still appears. */
export interface EmployeeDirectoryEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  employee_code: string | null;
  designation: string | null;
  department_id: string | null;
  department_name: string | null;
  employment_status: string | null;
  employment_type: EmploymentType | null;
  joining_date: string | null;
}

export interface EmployeeDirectoryParams {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: string;
  employment_status?: string;
}
