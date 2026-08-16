import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { departmentService, employeeDirectoryService } from "./service";
import type {
  DepartmentCreatePayload,
  DepartmentListParams,
  DepartmentUpdatePayload,
  EmployeeDirectoryParams,
} from "./types";

export function useDepartments(params: DepartmentListParams) {
  return useQuery({
    queryKey: queryKeys.departments.list(params),
    queryFn: () => departmentService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useDepartment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.departments.detail(id ?? ""),
    queryFn: () => departmentService.get(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.employeeDirectory.all });
  };
}

export function useCreateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (payload: DepartmentCreatePayload) => departmentService.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Department created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create department")),
  });
}

export function useUpdateDepartment(id: string) {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (payload: DepartmentUpdatePayload) => departmentService.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Department updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update department")),
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: string) => departmentService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Department deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't delete department")),
  });
}

export function useEmployeeDirectory(params: EmployeeDirectoryParams) {
  return useQuery({
    queryKey: queryKeys.employeeDirectory.list(params),
    queryFn: () => employeeDirectoryService.list(params),
    placeholderData: (prev) => prev,
  });
}
