/** A task staff set for a student. Mirrors backend `PriorityTaskRead`. */
export interface PriorityTaskRead {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_complete: boolean;
  completed_at: string | null;
  is_priority: boolean;
  assigned_by: string | null;
  assigned_by_name: string | null;
  created_at: string | null;
}

export interface PriorityTaskCreatePayload {
  title: string;
  description?: string | null;
  due_date?: string | null;
}

export interface PriorityTaskUpdatePayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  completed?: boolean;
}
