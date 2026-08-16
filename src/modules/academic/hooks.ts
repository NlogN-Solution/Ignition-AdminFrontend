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

function useInvalidateAcademic() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["academic"] });
}

export function useCreateCountry() {
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
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
  const invalidate = useInvalidateAcademic();
  return useMutation({
    mutationFn: (id: string) => academicService.intakes.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Intake removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
