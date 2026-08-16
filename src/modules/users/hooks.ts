import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { getErrorMessage } from "@/utils/errors";
import { userService } from "./service";
import type {
  EmployeeProfileUpsertPayload,
  StaffDirectoryParams,
  StudentEducationHistoryPayload,
  StudentProfileUpsertPayload,
  StudentWorkExperiencePayload,
  UserCreatePayload,
  UserListParams,
  UserUpdatePayload,
} from "./types";

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useStaffDirectory(params: StaffDirectoryParams) {
  return useQuery({
    queryKey: ["users", "staff-directory", params] as const,
    queryFn: () => userService.staffDirectory(params),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    queryFn: () => userService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useStudentProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.studentProfile.detail(userId ?? ""),
    queryFn: () => userService.getStudentProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUpsertStudentProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentProfileUpsertPayload) => userService.upsertStudentProfile(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentProfile.detail(userId) });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update profile")),
  });
}

export function useEducationHistory(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.studentEducation.list(userId ?? ""),
    queryFn: () => userService.listEducation(userId as string),
    enabled: Boolean(userId),
  });
}

export function useAddEducation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentEducationHistoryPayload) => userService.addEducation(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentEducation.list(userId) });
      toast.success("Education added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add education entry")),
  });
}

export function useUpdateEducation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: StudentEducationHistoryPayload }) =>
      userService.updateEducation(userId, entryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentEducation.list(userId) });
      toast.success("Education updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update education entry")),
  });
}

export function useRemoveEducation(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => userService.removeEducation(userId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentEducation.list(userId) });
      toast.success("Education entry removed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove education entry")),
  });
}

export function useWorkExperience(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.studentExperience.list(userId ?? ""),
    queryFn: () => userService.listExperience(userId as string),
    enabled: Boolean(userId),
  });
}

export function useAddExperience(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentWorkExperiencePayload) => userService.addExperience(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentExperience.list(userId) });
      toast.success("Experience added");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't add experience entry")),
  });
}

export function useUpdateExperience(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, payload }: { entryId: string; payload: StudentWorkExperiencePayload }) =>
      userService.updateExperience(userId, entryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentExperience.list(userId) });
      toast.success("Experience updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update experience entry")),
  });
}

export function useRemoveExperience(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => userService.removeExperience(userId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentExperience.list(userId) });
      toast.success("Experience entry removed");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't remove experience entry")),
  });
}

export function useEmployeeProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employeeProfile.detail(userId ?? ""),
    queryFn: () => userService.getEmployeeProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUpsertEmployeeProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeProfileUpsertPayload) => userService.upsertEmployeeProfile(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employeeProfile.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employeeProfile.timeline(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employeeDirectory.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      toast.success("Employee profile updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update employee profile")),
  });
}

export function useEmployeeProfileTimeline(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employeeProfile.timeline(userId ?? ""),
    queryFn: () => userService.getEmployeeProfileTimeline(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreatePayload) => userService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User created");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't create user")),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword?: string }) => userService.resetPassword(id, newPassword),
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't reset password")),
  });
}

export function useEnableStudentPortal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.enablePortal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't enable student portal access")),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserUpdatePayload) => userService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update user")),
  });
}

export function useUploadUserAvatar(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("Avatar updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't upload avatar")),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User deactivated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't deactivate user")),
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User restored");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't restore user")),
  });
}
