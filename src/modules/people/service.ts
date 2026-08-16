import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  Department,
  DepartmentCreatePayload,
  DepartmentListParams,
  DepartmentUpdatePayload,
  EmployeeDirectoryEntry,
  EmployeeDirectoryParams,
} from "./types";

export const departmentService = {
  async list(params: DepartmentListParams): Promise<ListResponse<Department>> {
    const { data } = await apiClient.get<ListResponse<Department>>("/departments", { params });
    return data;
  },
  async get(id: string): Promise<Department> {
    const { data } = await apiClient.get<Department>(`/departments/${id}`);
    return data;
  },
  async create(payload: DepartmentCreatePayload): Promise<Department> {
    const { data } = await apiClient.post<Department>("/departments", payload);
    return data;
  },
  async update(id: string, payload: DepartmentUpdatePayload): Promise<Department> {
    const { data } = await apiClient.patch<Department>(`/departments/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<Department> {
    const { data } = await apiClient.delete<Department>(`/departments/${id}`);
    return data;
  },
};

export const employeeDirectoryService = {
  async list(params: EmployeeDirectoryParams): Promise<ListResponse<EmployeeDirectoryEntry>> {
    const { data } = await apiClient.get<ListResponse<EmployeeDirectoryEntry>>("/employees", { params });
    return data;
  },
};
