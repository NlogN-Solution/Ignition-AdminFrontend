import { apiClient } from "@/services/apiClient";
import type { MessageList, MessageRead, MessageThreadSummary } from "./types";

export const messageService = {
  async listThreads(): Promise<MessageThreadSummary[]> {
    const { data } = await apiClient.get<MessageThreadSummary[]>("/messages/threads");
    return data;
  },

  async getThread(studentId: string): Promise<MessageList> {
    const { data } = await apiClient.get<MessageList>(`/messages/${studentId}`);
    return data;
  },

  async send(studentId: string, body: string): Promise<MessageRead> {
    const { data } = await apiClient.post<MessageRead>(`/messages/${studentId}`, { body });
    return data;
  },

  async markThreadRead(studentId: string): Promise<{ updated: number }> {
    const { data } = await apiClient.post<{ updated: number }>(`/messages/${studentId}/read-all`);
    return data;
  },
};
