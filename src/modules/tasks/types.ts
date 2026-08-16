import type { TaskPriority, TaskStatus, TaskType } from "@/types/enums";

export interface TaskRead {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string;
  assigned_by: string | null;
  student_id: string | null;
  lead_id: string | null;
  application_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  task_type: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to: string;
  student_id?: string | null;
  lead_id?: string | null;
  application_id?: string | null;
  due_date?: string | null;
  remarks?: string | null;
}

export type TaskUpdatePayload = Partial<TaskCreatePayload> & { completed_at?: string | null };

export interface TaskListParams {
  page?: number;
  limit?: number;
  assigned_to?: string;
  assigned_by?: string;
  student_id?: string;
  lead_id?: string;
  application_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  task_type?: TaskType;
  search?: string;
}

export const TASK_STATUS_COLUMNS: TaskStatus[] = ["pending", "in_progress", "completed", "cancelled"] as TaskStatus[];
