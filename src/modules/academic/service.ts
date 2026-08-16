import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  CountryPayload,
  CountryRead,
  IntakePayload,
  IntakeRead,
  ProgramPayload,
  ProgramRead,
  UniversityPayload,
  UniversityRead,
} from "./types";

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export const academicService = {
  countries: {
    list: async (params: ListParams = {}) => (await apiClient.get<ListResponse<CountryRead>>("/countries", { params })).data,
    get: async (id: string) => (await apiClient.get<CountryRead>(`/countries/${id}`)).data,
    create: async (payload: CountryPayload) => (await apiClient.post<CountryRead>("/countries", payload)).data,
    update: async (id: string, payload: Partial<CountryPayload>) => (await apiClient.patch<CountryRead>(`/countries/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<CountryRead>(`/countries/${id}`)).data,
  },
  universities: {
    list: async (params: ListParams & { country_id?: string } = {}) =>
      (await apiClient.get<ListResponse<UniversityRead>>("/universities", { params })).data,
    get: async (id: string) => (await apiClient.get<UniversityRead>(`/universities/${id}`)).data,
    create: async (payload: UniversityPayload) => (await apiClient.post<UniversityRead>("/universities", payload)).data,
    update: async (id: string, payload: Partial<UniversityPayload>) =>
      (await apiClient.patch<UniversityRead>(`/universities/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<UniversityRead>(`/universities/${id}`)).data,
  },
  programs: {
    list: async (params: ListParams & { university_id?: string } = {}) =>
      (await apiClient.get<ListResponse<ProgramRead>>("/programs", { params })).data,
    get: async (id: string) => (await apiClient.get<ProgramRead>(`/programs/${id}`)).data,
    create: async (payload: ProgramPayload) => (await apiClient.post<ProgramRead>("/programs", payload)).data,
    update: async (id: string, payload: Partial<ProgramPayload>) => (await apiClient.patch<ProgramRead>(`/programs/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<ProgramRead>(`/programs/${id}`)).data,
  },
  intakes: {
    list: async (params: ListParams & { program_id?: string } = {}) =>
      (await apiClient.get<ListResponse<IntakeRead>>("/intakes", { params })).data,
    get: async (id: string) => (await apiClient.get<IntakeRead>(`/intakes/${id}`)).data,
    create: async (payload: IntakePayload) => (await apiClient.post<IntakeRead>("/intakes", payload)).data,
    update: async (id: string, payload: Partial<IntakePayload>) => (await apiClient.patch<IntakeRead>(`/intakes/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<IntakeRead>(`/intakes/${id}`)).data,
  },
};
