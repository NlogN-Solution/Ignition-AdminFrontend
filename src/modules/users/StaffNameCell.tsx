import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { useUser } from "./hooks";

/** GET /users/{id} only resolves non-student accounts for admin/super_admin — counsellors can't look up fellow staff. */
export function StaffNameCell({ userId, fallback = "Unassigned" }: { userId: string | null; fallback?: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const canResolve = isManagerRole(role);
  const { data, isLoading } = useUser(canResolve ? (userId ?? undefined) : undefined);

  if (!userId) return <span className="text-muted-foreground">{fallback}</span>;
  if (!canResolve) return <span className="text-muted-foreground">Assigned</span>;
  if (isLoading) return <span className="text-muted-foreground">…</span>;
  if (!data) return <span className="font-mono text-xs text-muted-foreground">#{userId.slice(0, 8)}</span>;

  return (
    <span className="text-foreground">
      {data.first_name} {data.last_name}
    </span>
  );
}
