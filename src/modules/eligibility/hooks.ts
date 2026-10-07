import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { eligibilityService } from "./service";
import type { EligibilityListParams } from "./types";

/**
 * Reads only.
 *
 * Everything a counsellor changes about an assessment — status, assignment,
 * notes, follow-ups — is the lead's, so the detail page uses
 * `@/modules/leads/hooks` for those and invalidates through them. A second set
 * of mutations here would give one record two caches to keep in step.
 */

export function useEligibilityAssessments(params: EligibilityListParams = {}) {
  return useQuery({
    queryKey: queryKeys.eligibility.list(params),
    queryFn: () => eligibilityService.list(params),
    placeholderData: (previous) => previous,
  });
}

/**
 * The newest eligibility assessment behind a lead, or null if the lead did not
 * come from the eligibility wizard. The lead page's way back to the
 * assessment, mirroring the assessment page's "Open full lead record".
 */
export function useLeadEligibilityAssessment(leadId: string | undefined, enabled = true) {
  const params: EligibilityListParams = { lead_id: leadId, limit: 1, sort: "newest" };
  return useQuery({
    queryKey: queryKeys.eligibility.list(params),
    queryFn: async () => (await eligibilityService.list(params)).items[0] ?? null,
    enabled: Boolean(leadId) && enabled,
  });
}

export function useEligibilityStats() {
  return useQuery({
    queryKey: queryKeys.eligibility.stats,
    queryFn: () => eligibilityService.stats(),
  });
}

export function useEligibilityAssessment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.eligibility.detail(id ?? ""),
    queryFn: () => eligibilityService.get(id as string),
    enabled: Boolean(id),
  });
}
