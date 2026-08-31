import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  CourseProfilePayload,
  CourseProfileRead,
  ImportPreview,
  MediaAssetRead,
  ScholarshipPayload,
  ScholarshipRead,
  UniversityRoutePayload,
  UniversityRouteRead,
  WebsiteProgram,
  WebsiteProgramPayload,
  WebsiteUniversity,
  WebsiteUniversityPayload,
} from "./types";

// `apiClient` folds /api/v1 into VITE_API_BASE_URL, so paths here are bare.

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const websiteService = {
  universities: {
    list: async (params: ListParams & { is_active?: boolean; is_partner?: boolean; country_id?: string } = {}) =>
      (await apiClient.get<ListResponse<WebsiteUniversity>>("/universities", { params })).data,
    get: async (id: string) => (await apiClient.get<WebsiteUniversity>(`/universities/${id}`)).data,
    create: async (payload: WebsiteUniversityPayload) =>
      (await apiClient.post<WebsiteUniversity>("/universities", payload)).data,
    update: async (id: string, payload: WebsiteUniversityPayload) =>
      (await apiClient.patch<WebsiteUniversity>(`/universities/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<WebsiteUniversity>(`/universities/${id}`)).data,
  },
  routes: {
    list: async (params: ListParams & { university_id?: string; is_published?: boolean } = {}) =>
      (await apiClient.get<ListResponse<UniversityRouteRead>>("/university-routes", { params })).data,
    create: async (payload: UniversityRoutePayload) =>
      (await apiClient.post<UniversityRouteRead>("/university-routes", payload)).data,
    update: async (id: string, payload: Partial<UniversityRoutePayload>) =>
      (await apiClient.patch<UniversityRouteRead>(`/university-routes/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<UniversityRouteRead>(`/university-routes/${id}`)).data,
  },
  courses: {
    list: async (
      params: ListParams & { university_id?: string; degree_level?: string; is_active?: boolean } = {},
    ) => (await apiClient.get<ListResponse<WebsiteProgram>>("/programs", { params })).data,
    get: async (id: string) => (await apiClient.get<WebsiteProgram>(`/programs/${id}`)).data,
    update: async (id: string, payload: WebsiteProgramPayload) =>
      (await apiClient.patch<WebsiteProgram>(`/programs/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<WebsiteProgram>(`/programs/${id}`)).data,
  },
  courseProfiles: {
    list: async (params: ListParams & { subject?: string; is_published?: boolean } = {}) =>
      (await apiClient.get<ListResponse<CourseProfileRead>>("/course-profiles", { params })).data,
    create: async (payload: CourseProfilePayload) =>
      (await apiClient.post<CourseProfileRead>("/course-profiles", payload)).data,
    update: async (id: string, payload: Partial<CourseProfilePayload>) =>
      (await apiClient.patch<CourseProfileRead>(`/course-profiles/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<CourseProfileRead>(`/course-profiles/${id}`)).data,
  },
  scholarships: {
    list: async (params: ListParams & { university_id?: string; kind?: string; is_published?: boolean } = {}) =>
      (await apiClient.get<ListResponse<ScholarshipRead>>("/scholarships", { params })).data,
    create: async (payload: ScholarshipPayload) =>
      (await apiClient.post<ScholarshipRead>("/scholarships", payload)).data,
    update: async (id: string, payload: Partial<ScholarshipPayload>) =>
      (await apiClient.patch<ScholarshipRead>(`/scholarships/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<ScholarshipRead>(`/scholarships/${id}`)).data,
  },
  media: {
    list: async (params: ListParams & { kind?: string; folder?: string } = {}) =>
      (await apiClient.get<ListResponse<MediaAssetRead>>("/media-assets", { params })).data,
    upload: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return (await apiClient.post<MediaAssetRead>("/media-assets/upload", body)).data;
    },
    update: async (id: string, payload: { alt_text?: string | null; caption?: string | null }) =>
      (await apiClient.patch<MediaAssetRead>(`/media-assets/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<MediaAssetRead>(`/media-assets/${id}`)).data,
  },
  imports: {
    /**
     * Upload next cycle's workbook. `apply` defaults to false, so the first
     * call is a dry run and the diff comes back for a human to read before
     * thousands of rows change.
     */
    catalogue: async (file: File, apply: boolean) => {
      const body = new FormData();
      body.append("file", file);
      body.append("apply", String(apply));
      return (await apiClient.post<ImportPreview>("/imports/catalogue", body)).data;
    },
  },
};
