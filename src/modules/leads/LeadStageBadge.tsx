import { cn } from "@/lib/utils";
import { stageOf, STAGE_LABELS, type LeadStage } from "@/modules/leads/types";
import type { LeadStatus } from "@/types/enums";

const STAGE_STYLES: Record<LeadStage, { dot: string; text: string; bg: string }> = {
  raw: { dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" },
  prospect: { dot: "bg-info", text: "text-info", bg: "bg-info/10" },
  client: { dot: "bg-success", text: "text-success", bg: "bg-success/10" },
  lost: { dot: "bg-danger", text: "text-danger", bg: "bg-danger/10" },
};

/**
 * Reads a lead's status in the staff vocabulary — "Prospect", not "Qualified".
 * The generic StatusBadge is left alone: ~15 other modules render raw statuses
 * through it and none of them mean these four stages.
 */
export function LeadStageBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const stage = stageOf(status);
  const style = STAGE_STYLES[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {STAGE_LABELS[stage]}
    </span>
  );
}
