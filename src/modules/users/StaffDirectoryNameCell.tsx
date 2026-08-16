import { useStaffDirectory } from "./hooks";

/** Unlike StaffNameCell (admin/super_admin only via GET /users/{id}), this
 * resolves through the minimal staff-directory search — available to every
 * staff role, so a counsellor can see who else is on their own appointment. */
export function StaffDirectoryNameCell({ userId, fallback = "Unassigned" }: { userId: string | null; fallback?: string }) {
  const { data, isLoading } = useStaffDirectory({ user_id: userId ?? undefined, limit: 1 });

  if (!userId) return <span className="text-muted-foreground">{fallback}</span>;
  if (isLoading) return <span className="text-muted-foreground">…</span>;
  const match = data?.[0];
  if (!match) return <span className="font-mono text-xs text-muted-foreground">#{userId.slice(0, 8)}</span>;

  return (
    <span className="text-foreground">
      {match.first_name} {match.last_name}
    </span>
  );
}
