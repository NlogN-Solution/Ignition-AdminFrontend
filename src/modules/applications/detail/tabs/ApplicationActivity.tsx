import { Activity, FileUp, Lock, PenLine, RefreshCw, Trash2, UserCog, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLogs } from "@/modules/activityLogs/hooks";
import { ActivityType, type ActivityLogRead } from "@/modules/activityLogs/types";
import { formatDateTime } from "@/utils/format";
import { UserRole } from "@/types/enums";
import { TabShell } from "./TabShell";

/**
 * The audit trail — wider than Status History, and a different question.
 *
 * Status History answers "what states has this been in". Activity answers "what
 * has anyone done to this record": edits, uploads, assignments, deletions, and
 * status changes among them. They overlap on status changes and nowhere else,
 * which is why both exist.
 *
 * ## Permissions
 *
 * `GET /activity-logs` is admin and super_admin only, and that restriction is
 * deliberately untouched — an audit log is exactly the sort of thing that
 * should not widen quietly. For every other role this renders an explanation
 * rather than firing a request that will 403, so a counsellor gets a sentence
 * instead of a spinner that never resolves.
 */

const ICONS: Partial<Record<string, LucideIcon>> = {
  [ActivityType.CREATE]: FileUp,
  [ActivityType.UPDATE]: PenLine,
  [ActivityType.STATUS_CHANGE]: RefreshCw,
  [ActivityType.ASSIGN]: UserCog,
  [ActivityType.UPLOAD]: FileUp,
  [ActivityType.DELETE]: Trash2,
};

export function ApplicationActivity({ applicationId, role }: { applicationId: string; role: string | undefined }) {
  const canRead = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

  const { data, isLoading } = useActivityLogs(
    canRead ? { entity_type: "application", entity_id: applicationId, limit: 50 } : { limit: 0 },
  );

  if (!canRead) {
    return (
      <TabShell title="Activity" description="Everything anyone has done to this application.">
        <EmptyState
          icon={Lock}
          title="Audit logs are restricted"
          description="Activity history is available to administrators. Status changes are visible to you on the Status History tab."
          className="border-none py-14"
        />
      </TabShell>
    );
  }

  const items = data?.items ?? [];

  return (
    <TabShell title="Activity" description="Everything anyone has done to this application.">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded yet"
          description="Edits, uploads, assignments and status changes against this application will appear here."
          className="border-none py-14"
        />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </TabShell>
  );
}

function ActivityRow({ entry }: { entry: ActivityLogRead }) {
  const Icon = ICONS[entry.activity_type] ?? Activity;

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span
        aria-hidden
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] text-foreground">{entry.description ?? entry.activity_type}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {formatDateTime(entry.created_at)}
          {entry.user_name ? ` · ${entry.user_name}` : " · System"}
        </p>
      </div>
    </li>
  );
}
