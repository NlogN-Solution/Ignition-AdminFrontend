import { motion } from "motion/react";
import { Check, Circle, Loader2, Ban, SkipForward, X } from "lucide-react";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { WorkflowStepStatus } from "@/types/enums";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { ApplicationWorkflowStepRead } from "./types";

const STATUS_STYLES: Record<
  string,
  { icon: typeof Check; ring: string; iconBg: string; iconColor: string; label: string }
> = {
  completed: { icon: Check, ring: "bg-success", iconBg: "bg-success", iconColor: "text-white", label: "Completed" },
  current: { icon: Loader2, ring: "bg-info", iconBg: "bg-info", iconColor: "text-white", label: "In progress" },
  pending: { icon: Circle, ring: "bg-border", iconBg: "bg-muted", iconColor: "text-muted-foreground/60", label: "Upcoming" },
  failed: { icon: X, ring: "bg-danger", iconBg: "bg-danger", iconColor: "text-white", label: "Failed" },
  skipped: { icon: SkipForward, ring: "bg-border", iconBg: "bg-muted", iconColor: "text-muted-foreground", label: "Skipped" },
  cancelled: { icon: Ban, ring: "bg-border", iconBg: "bg-muted", iconColor: "text-muted-foreground", label: "Cancelled" },
};

export function JourneyTimeline({
  steps,
  onSelectStep,
}: {
  steps: ApplicationWorkflowStepRead[];
  onSelectStep: (step: ApplicationWorkflowStepRead) => void;
}) {
  return (
    <div>
      {steps.map((step, index) => {
        const style = STATUS_STYLES[step.status] ?? STATUS_STYLES.pending;
        const Icon = style.icon;
        const isCurrent = step.status === WorkflowStepStatus.CURRENT;
        const isLast = index === steps.length - 1;
        const nextSegmentFilled = step.status === WorkflowStepStatus.COMPLETED;
        const timestamp = step.completed_at ?? step.started_at;

        return (
          <motion.button
            key={step.id}
            type="button"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
            onClick={() => onSelectStep(step)}
            className={cn(
              "group flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40",
              isCurrent && "bg-info/[0.04]",
            )}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  style.iconBg,
                  step.status === WorkflowStepStatus.PENDING && "border border-border",
                  step.status === WorkflowStepStatus.SKIPPED && "border border-dashed border-muted-foreground/40",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", style.iconColor, isCurrent && "animate-spin")} strokeWidth={2.25} />
              </span>
              {!isLast && <span className={cn("mt-1 w-px flex-1", nextSegmentFilled ? "bg-success/40" : "bg-border")} style={{ minHeight: 28 }} />}
            </div>

            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate text-[13px] font-medium", isCurrent ? "text-foreground" : step.status === "pending" ? "text-muted-foreground" : "text-foreground")}>
                  {step.stage_name_snapshot}
                </p>
                {timestamp && <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(timestamp)}</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <span className={cn(isCurrent && "font-medium text-info")}>{style.label}</span>
                {step.assigned_to && (
                  <>
                    <span>·</span>
                    <StaffNameCell userId={step.assigned_to} />
                  </>
                )}
              </div>
              {step.notes && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">{step.notes}</p>}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export function stepTimestampTitle(step: ApplicationWorkflowStepRead): string {
  if (step.completed_at) return `Completed ${formatDateTime(step.completed_at)}`;
  if (step.started_at) return `Started ${formatDateTime(step.started_at)}`;
  return "Not started";
}
