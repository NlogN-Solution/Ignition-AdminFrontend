import { Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import type { ApplicationStatusHistoryRead } from "@/modules/applications/types";
import { toneForStatus } from "@/utils/statusTone";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { TabShell } from "./TabShell";

/**
 * Every status transition this application has been through, newest first.
 *
 * Newest first because the question staff open this with is "what happened
 * most recently", not "how did this start" — the same reason the Latest Update
 * card on Overview shows `history[0]`.
 *
 * Each entry states the transition rather than just the destination: "Documents
 * Pending → Offer Received" tells you what was skipped, where a bare "Offer
 * Received" does not.
 */
export function ApplicationStatusHistory({
  history,
  isLoading,
}: {
  history: ApplicationStatusHistoryRead[] | undefined;
  isLoading: boolean;
}) {
  return (
    <TabShell title="Status History" description="Every status this application has moved through.">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No status changes recorded yet"
          description="Every time this application moves to a new status it is recorded here, with who changed it and why."
          className="border-none py-14"
        />
      ) : (
        <ol className="space-y-0">
          {history.map((entry, idx) => {
            const tone = toneForStatus(entry.new_status);
            const isLast = idx === history.length - 1;
            return (
              <li key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span aria-hidden className={cn("mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4", DOT[tone], RING[tone])} />
                  {!isLast && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
                </div>

                <div className={cn("min-w-0 flex-1", isLast ? "pb-1" : "pb-7")}>
                  <p className="text-[15px] font-medium text-foreground">
                    {APPLICATION_STATUS_LABELS[entry.new_status] ?? entry.new_status}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                    {entry.changed_by && (
                      <>
                        {" · Changed by "}
                        <StaffNameCell userId={entry.changed_by} />
                      </>
                    )}
                  </p>
                  {entry.remarks && (
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{entry.remarks}</p>
                  )}
                  {entry.old_status && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[12px] text-muted-foreground">
                      {APPLICATION_STATUS_LABELS[entry.old_status] ?? entry.old_status}
                      <span aria-hidden>→</span>
                      {APPLICATION_STATUS_LABELS[entry.new_status] ?? entry.new_status}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </TabShell>
  );
}

const DOT: Record<string, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const RING: Record<string, string> = {
  neutral: "ring-muted-foreground/15",
  info: "ring-info/15",
  success: "ring-success/15",
  warning: "ring-warning/15",
  danger: "ring-danger/15",
};
