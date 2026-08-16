import { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api";

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (!body) return error.message || fallback;
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      return body.detail.map((issue) => issue.msg).join(", ");
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
