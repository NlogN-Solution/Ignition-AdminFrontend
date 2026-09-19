import { apiClient } from "@/services/apiClient";
import type { PriorityTaskCreatePayload, PriorityTaskRead, PriorityTaskUpdatePayload } from "./types";

const base = (studentId: string) => `/students/${studentId}/priority-tasks`;

export const priorityTaskService = {
  async list(studentId: string): Promise<PriorityTaskRead[]> {
    return (await apiClient.get<PriorityTaskRead[]>(base(studentId))).data;
  },
  async create(studentId: string, payload: PriorityTaskCreatePayload): Promise<PriorityTaskRead> {
    return (await apiClient.post<PriorityTaskRead>(base(studentId), payload)).data;
  },
  async update(studentId: string, id: string, payload: PriorityTaskUpdatePayload): Promise<PriorityTaskRead> {
    return (await apiClient.patch<PriorityTaskRead>(`${base(studentId)}/${id}`, payload)).data;
  },
  async remove(studentId: string, id: string): Promise<void> {
    await apiClient.delete(`${base(studentId)}/${id}`);
  },
};
