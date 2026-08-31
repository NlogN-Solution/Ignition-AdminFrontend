import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { contentService } from "./contentService";
import type { BlogPostPayload, ContentBlockPayload, ContentPagePayload } from "./contentTypes";

function useInvalidateContent(pageId?: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
    if (pageId) void queryClient.invalidateQueries({ queryKey: queryKeys.content.page(pageId) });
  };
}

export function useContentPages(params: Parameters<typeof contentService.pages.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.content.pages(params),
    queryFn: () => contentService.pages.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useContentPage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.content.page(id ?? ""),
    queryFn: () => contentService.pages.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateContentPage() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (payload: ContentPagePayload) => contentService.pages.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateContentPage(pageId: string) {
  const invalidate = useInvalidateContent(pageId);
  return useMutation({
    mutationFn: (payload: Partial<ContentPagePayload>) => contentService.pages.update(pageId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteContentPage() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (id: string) => contentService.pages.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePublishContentPage(pageId: string) {
  const invalidate = useInvalidateContent(pageId);
  return useMutation({
    mutationFn: (isPublished: boolean) => contentService.pages.publish(pageId, isPublished),
    onSuccess: (result) => {
      invalidate();
      if (!result.page.is_published) {
        toast.success("Retracted");
        return;
      }
      // Say which of the two things happened. "Published" alone would hide the
      // case that matters to an editor about to go and check their work: the
      // row is live but the public site is still serving the old copy.
      toast.success(
        result.revalidated ? "Published — the site has been refreshed" : "Published — the site refreshes on its own schedule",
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateBlock(pageId: string) {
  const invalidate = useInvalidateContent(pageId);
  return useMutation({
    mutationFn: (payload: ContentBlockPayload) => contentService.blocks.create(payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateBlock(pageId: string) {
  const invalidate = useInvalidateContent(pageId);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<ContentBlockPayload, "page_id">> }) =>
      contentService.blocks.update(id, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteBlock(pageId: string) {
  const invalidate = useInvalidateContent(pageId);
  return useMutation({
    mutationFn: (id: string) => contentService.blocks.remove(id),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useReorderBlocks(pageId: string) {
  const invalidate = useInvalidateContent(pageId);
  return useMutation({
    mutationFn: (blockIds: string[]) => contentService.pages.reorder(pageId, blockIds),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBlogPosts(params: Parameters<typeof contentService.posts.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.content.posts(params),
    queryFn: () => contentService.posts.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBlogPost() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (payload: BlogPostPayload) => contentService.posts.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Article created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateBlogPost() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BlogPostPayload> }) =>
      contentService.posts.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Article saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteBlogPost() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: (id: string) => contentService.posts.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Article deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
