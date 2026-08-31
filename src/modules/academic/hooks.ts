import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { academicService } from "./service";
import type { CountryPayload, IntakePayload, ProgramPayload, UniversityPayload } from "./types";

export function useCountries(params: Parameters<typeof academicService.countries.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.academic.countries(params),
    queryFn: () => academicService.countries.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useUniversities(params: Parameters<typeof academicService.universities.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.academic.universities(params),
    queryFn: () => academicService.universities.list(params),
    placeholderData: (prev) => prev,
  });
}

export function usePrograms(params: Parameters<typeof academicService.programs.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.academic.programs(params),
    queryFn: () => academicService.programs.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: ["academic", "program-detail", id],
    queryFn: () => academicService.programs.get(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUniversity(id: string | undefined) {
  return useQuery({
    queryKey: ["academic", "university-detail", id],
    queryFn: () => academicService.universities.get(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntakes(params: Parameters<typeof academicService.intakes.list>[0] = {}) {
  return useQuery({
    queryKey: queryKeys.academic.intakes(params),
    queryFn: () => academicService.intakes.list(params),
    enabled: params.program_id !== undefined,
    placeholderData: (prev) => prev,
  });
}

/**
 * Invalidate one entity, not the whole module.
 *
 * This used to blow away all of `["academic"]` on every mutation, which is
 * fine at a hundred rows and wasteful now the catalogue holds ~4,800 courses:
 * renaming one country refetched every course list on screen. Countries and
 * universities still cascade downward, because a rename really does change
 * what the lists below them display.
 */
type AcademicEntity = "countries" | "universities" | "programs" | "intakes";

/**
 * The detail queries key on `*-detail` rather than the list key, so they have
 * to be named explicitly — a prefix invalidation of `["academic","programs"]`
 * would leave an open course sheet showing stale data.
 */
const CASCADES: Record<AcademicEntity, string[]> = {
  countries: ["countries", "universities", "university-detail", "programs", "program-detail"],
  universities: ["universities", "university-detail", "programs", "program-detail"],
  programs: ["programs", "program-detail", "intakes"],
  intakes: ["intakes"],
};

function useInvalidateAcademic(entity: AcademicEntity) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of CASCADES[entity]) {
      void queryClient.invalidateQueries({ queryKey: ["academic", key] });
    }
    // The website module reads the same rows through its own keys.
    void queryClient.invalidateQueries({ queryKey: ["website"] });
  };
}

export function useCreateCountry() {
  const invalidate = useInvalidateAcademic("countries");
  return useMutation({
    mutationFn: (payload: CountryPayload) => academicService.countries.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Country added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateUniversity() {
  const invalidate = useInvalidateAcademic("universities");
  return useMutation({
    mutationFn: (payload: UniversityPayload) => academicService.universities.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("University added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateProgram() {
  const invalidate = useInvalidateAcademic("programs");
  return useMutation({
    mutationFn: (payload: ProgramPayload) => academicService.programs.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Course added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateIntake() {
  const invalidate = useInvalidateAcademic("intakes");
  return useMutation({
    mutationFn: (payload: IntakePayload) => academicService.intakes.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Intake added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCountry() {
  const invalidate = useInvalidateAcademic("countries");
  return useMutation({
    mutationFn: (id: string) => academicService.countries.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Country removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteUniversity() {
  const invalidate = useInvalidateAcademic("universities");
  return useMutation({
    mutationFn: (id: string) => academicService.universities.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("University removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProgram() {
  const invalidate = useInvalidateAcademic("programs");
  return useMutation({
    mutationFn: (id: string) => academicService.programs.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Course removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteIntake() {
  const invalidate = useInvalidateAcademic("intakes");
  return useMutation({
    mutationFn: (id: string) => academicService.intakes.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Intake removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
