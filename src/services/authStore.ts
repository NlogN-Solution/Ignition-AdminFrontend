import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRole, UserStatus, Gender } from "@/types/enums";

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  avatar_url: string | null;
  bio: string | null;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: CurrentUser | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "ignition-auth" },
  ),
);
