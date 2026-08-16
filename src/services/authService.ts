import { apiClient } from "./apiClient";
import type { CurrentUser } from "./authStore";
import type { Gender, UserRole, UserStatus } from "@/types/enums";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
}

export const authService = {
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/register", payload);
    return data;
  },

  async me(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<CurrentUser> {
    const { data } = await apiClient.post<CurrentUser>("/auth/change-password", payload);
    return data;
  },
};
