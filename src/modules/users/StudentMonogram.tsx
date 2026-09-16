import { useAuthStore } from "@/services/authStore";
import { canBrowseApplicants } from "@/constants/permissions";
import { initials } from "@/utils/format";
import { useUser } from "./hooks";

/**
 * Two letters for an avatar, from a user id.
 *
 * The same permission gate as `StudentNameCell`, and for the same reason:
 * `GET /users/{id}` is admin/super_admin/counsellor-only, so a role that
 * cannot resolve a user gets a neutral placeholder rather than a failed
 * request. It shares that component's cache entry, so a row showing both makes
 * one call, not two.
 */
export function StudentMonogram({ userId }: { userId: string | null }) {
  const currentUser = useAuthStore((s) => s.user);
  const canResolve = canBrowseApplicants(currentUser?.role);
  const isSelf = Boolean(userId) && currentUser?.id === userId;
  const { data } = useUser(canResolve && !isSelf ? (userId ?? undefined) : undefined);

  if (isSelf && currentUser) return <>{initials(currentUser.first_name, currentUser.last_name)}</>;
  if (!data) return <>··</>;
  return <>{initials(data.first_name, data.last_name)}</>;
}
