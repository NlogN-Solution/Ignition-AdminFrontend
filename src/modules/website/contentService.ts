import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";
import type {
  BlogPostPayload,
  BlogPostRead,
  ContentPagePreview,
  ContentPagePublishResult,
  ContentBlockPayload,
  ContentBlockRead,
  ContentPageDetail,
  ContentPagePayload,
  ContentPageRead,
} from "./contentTypes";

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const contentService = {
  pages: {
    list: async (params: ListParams & { kind?: string; tag?: string; is_published?: boolean } = {}) =>
      (await apiClient.get<ListResponse<ContentPageRead>>("/content-pages", { params })).data,
    get: async (id: string) => (await apiClient.get<ContentPageDetail>(`/content-pages/${id}`)).data,
    create: async (payload: ContentPagePayload) =>
      (await apiClient.post<ContentPageRead>("/content-pages", payload)).data,
    update: async (id: string, payload: Partial<ContentPagePayload>) =>
      (await apiClient.patch<ContentPageRead>(`/content-pages/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<ContentPageRead>(`/content-pages/${id}`)).data,
    /** Publishing is its own act: it stamps the date and purges the site's cache. */
    publish: async (id: string, isPublished: boolean) =>
      (await apiClient.post<ContentPagePublishResult>(`/content-pages/${id}/publish`, { is_published: isPublished }))
        .data,
    preview: async (id: string) => (await apiClient.get<ContentPagePreview>(`/content-pages/${id}/preview`)).data,
    /** One call, so a drag never leaves the page half-ordered. */
    reorder: async (id: string, blockIds: string[]) =>
      (await apiClient.put<ContentBlockRead[]>(`/content-pages/${id}/blocks/order`, { block_ids: blockIds })).data,
  },
  blocks: {
    create: async (payload: ContentBlockPayload) =>
      (await apiClient.post<ContentBlockRead>("/content-blocks", payload)).data,
    update: async (id: string, payload: Partial<Omit<ContentBlockPayload, "page_id">>) =>
      (await apiClient.patch<ContentBlockRead>(`/content-blocks/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<ContentBlockRead>(`/content-blocks/${id}`)).data,
  },
  posts: {
    list: async (params: ListParams & { category?: string; is_published?: boolean } = {}) =>
      (await apiClient.get<ListResponse<BlogPostRead>>("/blog-posts", { params })).data,
    create: async (payload: BlogPostPayload) => (await apiClient.post<BlogPostRead>("/blog-posts", payload)).data,
    update: async (id: string, payload: Partial<BlogPostPayload>) =>
      (await apiClient.patch<BlogPostRead>(`/blog-posts/${id}`, payload)).data,
    remove: async (id: string) => (await apiClient.delete<BlogPostRead>(`/blog-posts/${id}`)).data,
  },
};
