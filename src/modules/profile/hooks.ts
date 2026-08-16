import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthStore } from "@/services/authStore";
import { getErrorMessage } from "@/utils/errors";
import { profileService } from "./service";
import type { UserSelfUpdatePayload } from "@/modules/users/types";

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload: UserSelfUpdatePayload) => profileService.updateMe(payload),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't update profile")),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
      toast.success("Avatar updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Couldn't upload avatar")),
  });
}
