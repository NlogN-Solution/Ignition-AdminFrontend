import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { activityLogService } from "./service";
import type { ActivityLogListParams } from "./types";

export function useActivityLogs(params: ActivityLogListParams) {
  return useQuery({
    queryKey: queryKeys.activityLogs.list(params),
    queryFn: () => activityLogService.list(params),
    placeholderData: (prev) => prev,
  });
}
