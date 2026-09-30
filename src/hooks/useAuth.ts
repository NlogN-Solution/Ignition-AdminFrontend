import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { authService, type LoginPayload } from "@/services/authService";
import { useAuthStore } from "@/services/authStore";
import { queryKeys } from "@/constants/queryKeys";
import { UserRole } from "@/types/enums";

/**
 * Both portals sign in through the same `/auth/login`, so a correct student
 * password is a correct password here too. The backend already refuses a
 * student token on every staff endpoint; this keeps the portal itself from
 * handing a student a session and a shell to sit in.
 */
export const WRONG_PORTAL_MESSAGE = "Student accounts sign in through the student portal, not here.";

function isStaff(user: { role: UserRole }) {
  return user.role !== UserRole.STUDENT;
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.me,
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!query.data) return;
    // A session restored from storage (or minted before this check existed)
    // gets the same test as a fresh login.
    if (!isStaff(query.data)) {
      authService.logout().catch(() => undefined);
      clear();
      return;
    }
    setUser(query.data);
  }, [query.data, setUser, clear]);

  return query;
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    // The role check lives inside `mutationFn` so a refusal lands in the
    // mutation's error state and the form shows it, rather than the page
    // navigating away first.
    mutationFn: async (payload: LoginPayload) => {
      const tokens = await authService.login(payload);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await authService.me();
      if (!isStaff(user)) {
        await authService.logout().catch(() => undefined);
        clear();
        throw new Error(WRONG_PORTAL_MESSAGE);
      }
      return user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
    onError: () => clear(),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout().catch(() => undefined),
    onSettled: () => {
      clear();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}

export function useChangePassword() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) => authService.changePassword(payload),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
  });
}

/** Mounted once near the app root — reacts to a forced logout from the axios 401/refresh-failure interceptor. */
export function useUnauthorizedListener() {
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleUnauthorized() {
      clear();
      queryClient.clear();
      navigate("/login", { replace: true });
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [clear, navigate, queryClient]);
}
