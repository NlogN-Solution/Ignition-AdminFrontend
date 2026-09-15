import { Ban, Check, ChevronDown, Circle, Loader2, Route, SkipForward, Sparkles, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { journeyStagesFor } from "@/modules/applications/lifecycle";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import type { ApplicationWorkflowRead, ApplicationWorkflowStepRead } from "@/modules/application-workflow/types";
import { ApplicationStatus, WorkflowStepStatus } from "@/types/enums";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * The journey: a vertical sequence of stages, each editable in place.
 *
 * It replaced the horizontal five-stage strip that used to span the top of the
 * page, and it kept the vertical form when it moved into a tab of its own. A
 * journey is a sequence, and a sequence reads down a column — the horizontal
 * strip could only ever show a stage name and one word beneath it before
 * running out of width.
 *
 * `wide` is the difference between the two placements it has had: false draws
 * it as a 300px rail, true gives each stage the room a full content column
 * allows, so the timestamp and owner sit beside the stage name instead of
 * stacking under it.
 *
 * ## Editable in place
 *
 * Each stage's status can be changed from its own menu, which writes through
 * `useUpdateWorkflowStep` — the same mutation the step sheet has always used.
 * Clicking the stage still opens `StepDetailSheet` for the things that need
 * room: notes, assignment and the activity on that step.
 *
 * ## Before a workflow exists
 *
 * There is nothing to edit, so the rail falls back to the five stages derived
 * from the application's own status (`journeyStagesFor`) — read-only, greyed,
 * and captioned as a preview — above the button that starts the real thing.
 * That is better than an empty panel: it shows what the journey is going to be.
 */

const STEP_STYLES: Record<string, { icon: LucideIcon; label: string; dot: string; text: string }> = {
  completed: { icon: Check, label: "Completed", dot: "bg-success text-white", text: "text-success" },
  current: { icon: Loader2, label: "In progress", dot: "bg-info text-white", text: "text-info" },
  pending: { icon: Circle, label: "Upcoming", dot: "bg-muted text-muted-foreground/60", text: "text-muted-foreground" },
  failed: { icon: X, label: "Failed", dot: "bg-danger text-white", text: "text-danger" },
  skipped: { icon: SkipForward, label: "Skipped", dot: "bg-muted text-muted-foreground", text: "text-muted-foreground" },
  cancelled: { icon: Ban, label: "Cancelled", dot: "bg-muted text-muted-foreground", text: "text-muted-foreground" },
};

/** The transitions worth one click. Failed and cancelled live in the step sheet. */
const QUICK_STATUSES: WorkflowStepStatus[] = [
  WorkflowStepStatus.PENDING,
  WorkflowStepStatus.CURRENT,
  WorkflowStepStatus.COMPLETED,
  WorkflowStepStatus.SKIPPED,
];

interface Props {
  /** Lay out for a full content column rather than a narrow side rail. */
  wide?: boolean;
  workflow: ApplicationWorkflowRead | null | undefined;
  isLoading: boolean;
  status: ApplicationStatus;
  canManage: boolean;
  isStarting: boolean;
  isUpdating: boolean;
  onStart: () => void;
  onSelectStep: (step: ApplicationWorkflowStepRead) => void;
  onSetStepStatus: (stepId: string, status: WorkflowStepStatus) => void;
}

export function ApplicationJourneyPanel({
  wide = false,
  workflow,
  isLoading,
  status,
  canManage,
  isStarting,
  isUpdating,
  onStart,
  onSelectStep,
  onSetStepStatus,
}: Props) {
  const completed = workflow?.steps.filter((s) => s.status === WorkflowStepStatus.COMPLETED).length ?? 0;
  const total = workflow?.steps.length ?? 0;

  return (
    <section aria-label="Application journey" className="rounded-2xl bg-card ring-1 ring-[var(--border)]">
      <header
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border",
          wide ? "px-5 py-4 sm:px-6" : "px-4 py-3.5",
        )}
      >
        <div className="flex items-center gap-2">
          <Route className={cn("text-muted-foreground", wide ? "h-4.5 w-4.5" : "h-4 w-4")} strokeWidth={2} aria-hidden />
          <div>
            <h2 className={cn("font-semibold tracking-[-0.015em] text-foreground", wide ? "text-[17px]" : "text-[14.5px]")}>
              Journey
            </h2>
            {wide && (
              <p className="text-[13px] text-muted-foreground">
                Each stage of the workflow. Change a stage from its menu, or open it for notes and assignment.
              </p>
            )}
          </div>
        </div>
        {total > 0 && (
          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
            {wide ? `${completed} of ${total} stages complete` : `${completed}/${total}`}
          </span>
        )}
      </header>

      <div className={cn(wide ? "px-5 py-5 sm:px-6" : "px-4 py-4")}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : !workflow ? (
          <PreviewRail status={status} canManage={canManage} isStarting={isStarting} onStart={onStart} />
        ) : (
          <ol>
            {workflow.steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                wide={wide}
                isLast={i === workflow.steps.length - 1}
                canManage={canManage}
                isUpdating={isUpdating}
                onOpen={() => onSelectStep(step)}
                onSetStatus={(next) => onSetStepStatus(step.id, next)}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function StepRow({
  step,
  wide,
  isLast,
  canManage,
  isUpdating,
  onOpen,
  onSetStatus,
}: {
  step: ApplicationWorkflowStepRead;
  wide: boolean;
  isLast: boolean;
  canManage: boolean;
  isUpdating: boolean;
  onOpen: () => void;
  onSetStatus: (status: WorkflowStepStatus) => void;
}) {
  const style = STEP_STYLES[step.status] ?? STEP_STYLES.pending;
  const Icon = style.icon;
  const isCurrent = step.status === WorkflowStepStatus.CURRENT;
  const timestamp = step.completed_at ?? step.started_at;

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          aria-hidden
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            style.dot,
            step.status === WorkflowStepStatus.PENDING && "border border-border",
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", isCurrent && "animate-spin")} strokeWidth={2.5} />
        </span>
        {!isLast && (
          <span
            aria-hidden
            className={cn(
              "mt-1 w-px flex-1",
              step.status === WorkflowStepStatus.COMPLETED ? "bg-success/40" : "bg-border",
            )}
            style={{ minHeight: 22 }}
          />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : wide ? "pb-6" : "pb-4")}>
        <div className="flex items-start justify-between gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            <span
              className={cn(
                "block font-medium leading-snug",
                wide ? "text-[15.5px]" : "text-[13.5px]",
                step.status === WorkflowStepStatus.PENDING ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.stage_name_snapshot}
            </span>
          </button>

          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isUpdating}
                  aria-label={`Change status of ${step.stage_name_snapshot}`}
                  className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:opacity-50"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                  Move this stage to
                </DropdownMenuLabel>
                {QUICK_STATUSES.map((s) => (
                  <DropdownMenuItem key={s} disabled={s === step.status} onSelect={() => onSetStatus(s)}>
                    {STEP_STYLES[s].label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onOpen}>Open stage details…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <p className={cn("mt-0.5", wide ? "text-[13.5px]" : "text-[12px]", style.text)}>
          {style.label}
          {timestamp && <span className="text-muted-foreground"> · {formatRelativeTime(timestamp)}</span>}
          {wide && step.assigned_to && (
            <span className="text-muted-foreground">
              {" · "}
              <StaffNameCell userId={step.assigned_to} />
            </span>
          )}
        </p>
        {!wide && step.assigned_to && (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            <StaffNameCell userId={step.assigned_to} />
          </p>
        )}
        {wide && step.notes && (
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">{step.notes}</p>
        )}
      </div>
    </li>
  );
}

/**
 * What the journey will look like, before one has been started. Derived from
 * the application's status so it is not a fiction — these are the stages this
 * application is already moving through, they just are not being tracked yet.
 */
function PreviewRail({
  status,
  canManage,
  isStarting,
  onStart,
}: {
  status: ApplicationStatus;
  canManage: boolean;
  isStarting: boolean;
  onStart: () => void;
}) {
  const stages = journeyStagesFor(status);

  return (
    <div>
      <ol className="opacity-60">
        {stages.map((stage, i) => (
          <li key={stage.name} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  stage.state === "pending" ? "border-border bg-muted" : "border-transparent bg-primary/20",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current text-muted-foreground" />
              </span>
              {i < stages.length - 1 && <span aria-hidden className="mt-1 w-px flex-1 bg-border" style={{ minHeight: 18 }} />}
            </div>
            <div className="min-w-0 flex-1 pb-3.5">
              <p className="text-[13.5px] leading-snug text-muted-foreground">{stage.name}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-1 rounded-xl border border-dashed border-border p-3.5">
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {canManage
            ? "Not tracked yet. Starting a journey picks the template for the destination country and seeds the document checklist."
            : "The journey for this application has not been started yet."}
        </p>
        {canManage && (
          <Button size="sm" className="mt-3 w-full" disabled={isStarting} onClick={onStart}>
            {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Start journey
          </Button>
        )}
      </div>
    </div>
  );
}
