import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type { TaskCreatePayload, TaskListParams, TaskRead, TaskUpdatePayload } from "./types";

export const taskService = {
  async list(params: TaskListParams): Promise<ListResponse<TaskRead>> {
    const { data } = await apiClient.get<ListResponse<TaskRead>>("/tasks", { params });
    return data;
  },
  async get(id: string): Promise<TaskRead> {
    const { data } = await apiClient.get<TaskRead>(`/tasks/${id}`);
    return data;
  },
  async create(payload: TaskCreatePayload): Promise<TaskRead> {
    const { data } = await apiClient.post<TaskRead>("/tasks", payload);
    return data;
  },
  async update(id: string, payload: TaskUpdatePayload): Promise<TaskRead> {
    const { data } = await apiClient.patch<TaskRead>(`/tasks/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<TaskRead> {
    const { data } = await apiClient.delete<TaskRead>(`/tasks/${id}`);
    return data;
  },
};
