import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { websiteService } from "./service";
import type {
  ScholarshipPayload,
  UniversityRoutePayload,
  WebsiteProgramPayload,
  WebsiteUniversityPayload,
} from "./types";

/**
 * Invalidation is scoped per entity rather than blowing away one shared key.
 * The academic module invalidates all of `["academic"]` on every mutation,
 * which is fine at a hundred rows and wasteful at ~4,800 — editing one course
 * would refetch every university list on screen.
 */
function useInvalidate(keys: readonly (readonly unknown[])[]) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of keys) void queryClient.invalidateQueries({ queryKey: key });
  };
}

// ── Universities ─────────────────────────────────────────────────────────────

export function useWebsiteUniversities(params: Parameters<typeof websiteService.universities.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.website.universities(params),
    queryFn: () => websiteService.universities.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useWebsiteUniversity(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.website.university(id ?? ""),
    queryFn: () => websiteService.universities.get(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateWebsiteUniversity(id: string) {
  const invalidate = useInvalidate([queryKeys.website.all, ["academic"]]);
  return useMutation({
    mutationFn: (payload: WebsiteUniversityPayload) => websiteService.universities.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("University saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Deleting a university takes its courses, entry routes and scholarships with
 * it, so this lives only on the detail page — where the person pressing it has
 * the whole record in front of them — and never on a list row.
 */
export function useDeleteWebsiteUniversity() {
  const invalidate = useInvalidate([queryKeys.website.all, ["academic"]]);
  return useMutation({
    mutationFn: (id: string) => websiteService.universities.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("University deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateWebsiteUniversity() {
  const invalidate = useInvalidate([queryKeys.website.all, ["academic"]]);
  return useMutation({
    mutationFn: (payload: WebsiteUniversityPayload) => websiteService.universities.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("University created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Entry routes ─────────────────────────────────────────────────────────────

export function useUniversityRoutes(universityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.website.routes(universityId ?? ""),
    queryFn: () => websiteService.routes.list({ university_id: universityId, limit: 50 }),
    enabled: Boolean(universityId),
  });
}

export function useCreateUniversityRoute(universityId: string) {
  const invalidate = useInvalidate([queryKeys.website.routes(universityId)]);
  return useMutation({
    mutationFn: (payload: UniversityRoutePayload) => websiteService.routes.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Route added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateUniversityRoute(universityId: string) {
  const invalidate = useInvalidate([queryKeys.website.routes(universityId)]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UniversityRoutePayload> }) =>
      websiteService.routes.update(id, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteUniversityRoute(universityId: string) {
  const invalidate = useInvalidate([queryKeys.website.routes(universityId)]);
  return useMutation({
    mutationFn: (id: string) => websiteService.routes.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Route removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Courses ──────────────────────────────────────────────────────────────────

export function useWebsiteCourses(params: Parameters<typeof websiteService.courses.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.website.courses(params),
    queryFn: () => websiteService.courses.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useWebsiteCourse(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.website.course(id ?? ""),
    queryFn: () => websiteService.courses.get(id as string),
    enabled: Boolean(id),
  });
}

export function useDeleteWebsiteCourse() {
  const invalidate = useInvalidate([queryKeys.website.all, ["academic"]]);
  return useMutation({
    mutationFn: (id: string) => websiteService.courses.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Course deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateWebsiteCourse() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WebsiteProgramPayload }) =>
      websiteService.courses.update(id, payload),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Bulk publish / classify. Issued as N requests rather than one — the backend
 * has no bulk endpoint, and inventing a client-side "transaction" that can
 * half-fail would be worse than reporting how many succeeded.
 */
export function useBulkUpdateCourses() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: async ({ ids, payload }: { ids: string[]; payload: WebsiteProgramPayload }) => {
      const results = await Promise.allSettled(ids.map((id) => websiteService.courses.update(id, payload)));
      const failed = results.filter((result) => result.status === "rejected").length;
      return { total: ids.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      invalidate();
      if (failed === 0) toast.success(`${total} course${total === 1 ? "" : "s"} updated`);
      else toast.warning(`${total - failed} of ${total} updated — ${failed} failed`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Scholarships ─────────────────────────────────────────────────────────────

export function useScholarships(params: Parameters<typeof websiteService.scholarships.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.website.scholarships(params),
    queryFn: () => websiteService.scholarships.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateScholarship() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: (payload: ScholarshipPayload) => websiteService.scholarships.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Scholarship added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateScholarship() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ScholarshipPayload> }) =>
      websiteService.scholarships.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Scholarship saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteScholarship() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: (id: string) => websiteService.scholarships.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Scholarship deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Course profiles ──────────────────────────────────────────────────────────

export function useCourseProfiles(params: Parameters<typeof websiteService.courseProfiles.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.website.courseProfiles(params),
    queryFn: () => websiteService.courseProfiles.list(params),
    placeholderData: (prev) => prev,
  });
}

// ── Media ────────────────────────────────────────────────────────────────────

export function useMediaAssets(params: Parameters<typeof websiteService.media.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.website.media(params),
    queryFn: () => websiteService.media.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useUploadMedia() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: (file: File) => websiteService.media.upload(file),
    onSuccess: () => {
      invalidate();
      toast.success("Uploaded");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateMedia() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { alt_text?: string | null; caption?: string | null } }) =>
      websiteService.media.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidate([queryKeys.website.all]);
  return useMutation({
    mutationFn: (id: string) => websiteService.media.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Imports ──────────────────────────────────────────────────────────────────

export function useImportCatalogue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, apply }: { file: File; apply: boolean }) =>
      websiteService.imports.catalogue(file, apply),
    onSuccess: (preview) => {
      if (preview.applied) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.website.all });
        void queryClient.invalidateQueries({ queryKey: ["academic"] });
        toast.success("Catalogue imported");
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
