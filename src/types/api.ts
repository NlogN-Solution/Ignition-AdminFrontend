// Matches the actual (unwrapped) response shapes the backend returns —
// see backend/app/schemas/*.py `*List` models. No success/message envelope exists on the wire.

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiErrorBody {
  detail: string | { type: string; loc: (string | number)[]; msg: string; input?: unknown }[];
}

export type ID = string;
