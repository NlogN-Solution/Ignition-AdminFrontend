import { apiClient } from "@/services/apiClient";
import type { Journey, ReviewInput, SlotInput, SlotOutcome } from "./types";

/** `routes/journey.py`. Every action answers with the whole journey. */
const base = (applicationId: string) => `/applications/${applicationId}/journey`;

export const applicationJourneyService = {
  async get(applicationId: string): Promise<Journey | null> {
    try {
      const { data } = await apiClient.get<Journey>(base(applicationId));
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw error;
    }
  },

  async review(applicationId: string, submissionId: string, payload: ReviewInput): Promise<Journey> {
    const { data } = await apiClient.post<Journey>(`${base(applicationId)}/submissions/${submissionId}/review`, payload);
    return data;
  },

  async publishSlots(applicationId: string, stepId: string, slots: SlotInput[]): Promise<Journey> {
    const { data } = await apiClient.post<Journey>(`${base(applicationId)}/steps/${stepId}/slots`, { slots });
    return data;
  },

  async withdrawSlot(applicationId: string, slotId: string): Promise<Journey> {
    const { data } = await apiClient.delete<Journey>(`${base(applicationId)}/slots/${slotId}`);
    return data;
  },

  async recordOutcome(applicationId: string, slotId: string, outcome: SlotOutcome, note?: string): Promise<Journey> {
    const { data } = await apiClient.post<Journey>(`${base(applicationId)}/slots/${slotId}/outcome`, {
      outcome,
      note: note || null,
    });
    return data;
  },

  async switchTemplate(applicationId: string, templateId?: string): Promise<Journey> {
    const { data } = await apiClient.post<Journey>(`${base(applicationId)}/switch-template`, {
      template_id: templateId ?? null,
    });
    return data;
  },
};
