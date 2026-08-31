import { useNavigate } from "react-router";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useApplications } from "@/modules/applications/hooks";
import { ProgramNameCell } from "@/modules/academic/ProgramNameCell";
import { WorkflowProgressChip } from "@/modules/application-workflow/WorkflowProgressChip";
import { formatDate } from "@/utils/format";

/**
 * The client stage's second tab. `useApplications` has no `enabled` guard — passing
 * `{}` would fetch every application in the system — so this component is mounted
 * inside its `TabsContent` and nowhere else: Radix unmounts inactive tabs, which is
 * what keeps the query tab-scoped.
 */
export function LeadApplicationsTab({
  studentId,
  onStartApplication,
}: {
  studentId: string;
  onStartApplication: () => void;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useApplications({ student_id: studentId, limit: 20 });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Applications</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onStartApplication}>
          <Plus className="h-3 w-3" /> Start application
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Start one from here — the student is already filled in."
          action={
            <Button size="sm" onClick={onStartApplication}>
              <Plus className="h-3.5 w-3.5" /> Start application
            </Button>
          }
          className="border-none py-8"
        />
      ) : (
        <div className="divide-y divide-border">
          {data.items.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(`/applications/${app.id}`)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <ProgramNameCell programId={app.program_id} />
                  <p className="text-[11px] text-muted-foreground">Started {formatDate(app.created_at)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <WorkflowProgressChip applicationId={app.id} />
                <StatusBadge status={app.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
