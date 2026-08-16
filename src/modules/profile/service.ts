import { apiClient } from "@/services/apiClient";
import type { CurrentUser } from "@/services/authStore";
import type { UserSelfUpdatePayload } from "@/modules/users/types";

export const profileService = {
  async updateMe(payload: UserSelfUpdatePayload): Promise<CurrentUser> {
    const { data } = await apiClient.patch<CurrentUser>("/users/me", payload);
    return data;
  },

  async uploadAvatar(file: File): Promise<CurrentUser> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<CurrentUser>("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
