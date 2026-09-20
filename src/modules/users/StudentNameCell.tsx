import { useAuthStore } from "@/services/authStore";
import { canBrowseApplicants } from "@/constants/permissions";
import { useUser } from "./hooks";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The applicant's name on a record that belongs to them.
 *
 * `GET /users/{id}` is admin/manager/counsellor-only (counsellors scoped to
 * students), so other roles see a short reference instead of a name — except a
 * student looking at their own id, which resolves from the auth store with no
 * request needed.
 *
 * It asks for soft-deleted accounts too. Deleting a student does not delete
 * their applications, documents or appointments, and with the default filter
 * those rows rendered as `#21583416` — the applicant column of a live
 * application showing an id fragment, unsearchable by the name the file is
 * known by. A removed account is labelled rather than hidden: the record is
 * still real, and staff should be able to tell why the student cannot be
 * reached.
 */
export function StudentNameCell({ userId }: { userId: string | null }) {
  const currentUser = useAuthStore((s) => s.user);
  const canResolve = canBrowseApplicants(currentUser?.role);
  const isSelf = Boolean(userId) && currentUser?.id === userId;
  const { data, isLoading } = useUser(canResolve && !isSelf ? (userId ?? undefined) : undefined, {
    includeDeleted: true,
  });

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
      {data.deleted_at ? (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(removed)</span>
      ) : null}
    </span>
  );
}
