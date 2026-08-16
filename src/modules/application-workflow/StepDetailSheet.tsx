import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserPicker } from "@/components/shared/UserPicker";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { useAddStepComment, useUpdateWorkflowStep, useWorkflowStepActivities } from "./hooks";
import { stepTimestampTitle } from "./JourneyTimeline";
import type { ApplicationWorkflowStepRead } from "./types";
import { WorkflowStepStatus } from "@/types/enums";
import { formatDateTime, formatRelativeTime, toTitleCase } from "@/utils/format";

export function StepDetailSheet({
  applicationId,
  step,
  open,
  onOpenChange,
  readOnly = false,
}: {
  applicationId: string;
  step: ApplicationWorkflowStepRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}) {
  const updateStep = useUpdateWorkflowStep(applicationId);
  const addComment = useAddStepComment(applicationId);
  const { data: activities, isLoading: activitiesLoading } = useWorkflowStepActivities(applicationId, step?.id);

  const [notes, setNotes] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    setNotes(step?.notes ?? "");
    setComment("");
  }, [step]);

  if (!step) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{step.stage_name_snapshot}</SheetTitle>
            <StatusBadge status={step.status} />
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Status</p>
              <Select
                value={step.status}
                disabled={readOnly}
                onValueChange={(value) => updateStep.mutate({ stepId: step.id, payload: { status: value as WorkflowStepStatus } })}
              >
                <SelectTrigger className="mt-1 h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(WorkflowStepStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Assigned to</p>
              <div className="mt-1">
                <UserPicker
                  value={step.assigned_to}
                  onChange={(userId) => updateStep.mutate({ stepId: step.id, payload: { assigned_to: userId } })}
                  placeholder="Unassigned"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Timestamps</p>
              <p className="mt-1 text-foreground">{stepTimestampTitle(step)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Last updated by</p>
              <p className="mt-1">
                <StaffNameCell userId={step.updated_by} fallback="—" />
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => !readOnly && notes !== (step.notes ?? "") && updateStep.mutate({ stepId: step.id, payload: { notes } })}
              rows={3}
              placeholder="Add context for this step…"
              readOnly={readOnly}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-[13px] font-semibold text-foreground">Activity</p>
            {activitiesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !activities || activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="space-y-3">
                {activities.map((activity) => (
                  <li key={activity.id} className="text-sm">
                    <div className="flex items-center gap-1.5 text-[13px]">
                      <StaffNameCell userId={activity.performed_by} fallback="System" />
                      <span className="text-muted-foreground">
                        {activity.activity_type === "status_changed" &&
                          `changed status ${activity.old_status ? `from ${toTitleCase(activity.old_status)} ` : ""}to ${toTitleCase(activity.new_status ?? "")}`}
                        {activity.activity_type === "assigned" && "updated the assignee"}
                        {activity.activity_type === "note_added" && "updated the notes"}
                        {activity.activity_type === "created" && "created this step"}
                        {activity.activity_type === "comment" && "commented"}
                      </span>
                    </div>
                    {activity.comment && activity.activity_type === "comment" && (
                      <p className="mt-1 rounded-lg bg-muted/50 px-3 py-2 text-foreground">{activity.comment}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70" title={formatDateTime(activity.created_at)}>
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 border-t border-border p-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              rows={1}
              className="min-h-9 resize-none"
            />
            <Button
              size="icon"
              disabled={!comment.trim() || addComment.isPending}
              onClick={() => addComment.mutate({ stepId: step.id, comment }, { onSuccess: () => setComment("") })}
            >
              {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
