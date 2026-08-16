import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type { ActivityLogListParams, ActivityLogRead } from "./types";

export const activityLogService = {
  async list(params: ActivityLogListParams): Promise<ListResponse<ActivityLogRead>> {
    const { data } = await apiClient.get<ListResponse<ActivityLogRead>>("/activity-logs", { params });
    return data;
  },
};
