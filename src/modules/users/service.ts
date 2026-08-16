import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  EmployeeEmploymentEventRead,
  EmployeeProfileRead,
  EmployeeProfileUpsertPayload,
  ResetPasswordResponse,
  StaffDirectoryEntry,
  StaffDirectoryParams,
  StudentEducationHistoryPayload,
  StudentEducationHistoryRead,
  StudentProfileRead,
  StudentProfileUpsertPayload,
  StudentWorkExperiencePayload,
  StudentWorkExperienceRead,
  UserCreatePayload,
  UserListParams,
  UserRead,
  UserUpdatePayload,
} from "./types";

export const userService = {
  async list(params: UserListParams): Promise<ListResponse<UserRead>> {
    const { data } = await apiClient.get<ListResponse<UserRead>>("/users", { params });
    return data;
  },

  async staffDirectory(params: StaffDirectoryParams): Promise<StaffDirectoryEntry[]> {
    const { data } = await apiClient.get<{ items: StaffDirectoryEntry[] }>("/users/staff-directory", { params });
    return data.items;
  },

  async get(id: string): Promise<UserRead> {
    const { data } = await apiClient.get<UserRead>(`/users/${id}`);
    return data;
  },

  async create(payload: UserCreatePayload): Promise<UserRead> {
    const { data } = await apiClient.post<UserRead>("/users", payload);
    return data;
  },

  async update(id: string, payload: UserUpdatePayload): Promise<UserRead> {
    const { data } = await apiClient.patch<UserRead>(`/users/${id}`, payload);
    return data;
  },

  async uploadAvatar(id: string, file: File): Promise<UserRead> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<UserRead>(`/users/${id}/avatar`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async remove(id: string): Promise<UserRead> {
    const { data } = await apiClient.delete<UserRead>(`/users/${id}`);
    return data;
  },

  async restore(id: string): Promise<UserRead> {
    const { data } = await apiClient.post<UserRead>(`/users/${id}/restore`);
    return data;
  },

  async resetPassword(id: string, newPassword?: string): Promise<ResetPasswordResponse> {
    const { data } = await apiClient.post<ResetPasswordResponse>(`/users/${id}/reset-password`, {
      new_password: newPassword || null,
    });
    return data;
  },

  async enablePortal(id: string): Promise<ResetPasswordResponse> {
    const { data } = await apiClient.post<ResetPasswordResponse>(`/users/${id}/enable-portal`);
    return data;
  },

  async getEmployeeProfile(userId: string): Promise<EmployeeProfileRead | null> {
    try {
      const { data } = await apiClient.get<EmployeeProfileRead>(`/users/${userId}/employee-profile`);
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },

  async upsertEmployeeProfile(userId: string, payload: EmployeeProfileUpsertPayload): Promise<EmployeeProfileRead> {
    const { data } = await apiClient.patch<EmployeeProfileRead>(`/users/${userId}/employee-profile`, payload);
    return data;
  },

  async getEmployeeProfileTimeline(userId: string): Promise<EmployeeEmploymentEventRead[]> {
    const { data } = await apiClient.get<EmployeeEmploymentEventRead[]>(`/users/${userId}/employee-profile/timeline`);
    return data;
  },

  async getStudentProfile(userId: string): Promise<StudentProfileRead | null> {
    try {
      const { data } = await apiClient.get<StudentProfileRead>(`/users/${userId}/student-profile`);
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },

  async upsertStudentProfile(userId: string, payload: StudentProfileUpsertPayload): Promise<StudentProfileRead> {
    const { data } = await apiClient.patch<StudentProfileRead>(`/users/${userId}/student-profile`, payload);
    return data;
  },

  async listEducation(userId: string): Promise<StudentEducationHistoryRead[]> {
    const { data } = await apiClient.get<StudentEducationHistoryRead[]>(`/users/${userId}/education`);
    return data;
  },

  async addEducation(userId: string, payload: StudentEducationHistoryPayload): Promise<StudentEducationHistoryRead> {
    const { data } = await apiClient.post<StudentEducationHistoryRead>(`/users/${userId}/education`, payload);
    return data;
  },

  async updateEducation(userId: string, entryId: string, payload: StudentEducationHistoryPayload): Promise<StudentEducationHistoryRead> {
    const { data } = await apiClient.patch<StudentEducationHistoryRead>(`/users/${userId}/education/${entryId}`, payload);
    return data;
  },

  async removeEducation(userId: string, entryId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/education/${entryId}`);
  },

  async listExperience(userId: string): Promise<StudentWorkExperienceRead[]> {
    const { data } = await apiClient.get<StudentWorkExperienceRead[]>(`/users/${userId}/experience`);
    return data;
  },

  async addExperience(userId: string, payload: StudentWorkExperiencePayload): Promise<StudentWorkExperienceRead> {
    const { data } = await apiClient.post<StudentWorkExperienceRead>(`/users/${userId}/experience`, payload);
    return data;
  },

  async updateExperience(userId: string, entryId: string, payload: StudentWorkExperiencePayload): Promise<StudentWorkExperienceRead> {
    const { data } = await apiClient.patch<StudentWorkExperienceRead>(`/users/${userId}/experience/${entryId}`, payload);
    return data;
  },

  async removeExperience(userId: string, entryId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/experience/${entryId}`);
  },
};
