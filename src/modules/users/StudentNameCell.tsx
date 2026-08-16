import { useAuthStore } from "@/services/authStore";
import { canBrowseApplicants } from "@/constants/permissions";
import { useUser } from "./hooks";
import { Skeleton } from "@/components/ui/skeleton";

/** GET /users/{id} is admin/super_admin/counsellor-only (counsellor scoped to students), so other roles see a short reference instead of a name — except a student looking at their own id, which resolves from the auth store with no request needed. */
export function StudentNameCell({ userId }: { userId: string | null }) {
  const currentUser = useAuthStore((s) => s.user);
  const canResolve = canBrowseApplicants(currentUser?.role);
  const isSelf = Boolean(userId) && currentUser?.id === userId;
  const { data, isLoading } = useUser(canResolve && !isSelf ? (userId ?? undefined) : undefined);

  if (!userId) return <span className="text-muted-foreground">—</span>;
  if (isSelf && currentUser) {
    return (
      <span className="text-foreground">
        {currentUser.first_name} {currentUser.last_name}
      </span>
    );
  }
  if (!canResolve) return <span className="font-mono text-xs text-muted-foreground">#{userId.slice(0, 8)}</span>;
  if (isLoading) return <Skeleton className="h-4 w-24" />;
  if (!data) return <span className="font-mono text-xs text-muted-foreground">#{userId.slice(0, 8)}</span>;

  return (
    <span className="text-foreground">
      {data.first_name} {data.last_name}
    </span>
  );
}
