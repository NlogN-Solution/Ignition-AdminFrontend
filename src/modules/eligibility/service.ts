import { apiClient } from "@/services/apiClient";
import type {
  EligibilityAssessmentDetail,
  EligibilityListParams,
  EligibilityAssessmentRead,
  EligibilityStats,
} from "./types";

interface ListResponse {
  items: EligibilityAssessmentRead[];
  total: number;
  page: number;
  limit: number;
}

export const eligibilityService = {
  list: async (params: EligibilityListParams = {}) =>
    (await apiClient.get<ListResponse>("/eligibility-assessments", { params })).data,

  stats: async () => (await apiClient.get<EligibilityStats>("/eligibility-assessments/stats")).data,

  get: async (id: string) =>
    (await apiClient.get<EligibilityAssessmentDetail>(`/eligibility-assessments/${id}`)).data,
};
