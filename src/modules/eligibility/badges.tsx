import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INDICATOR_LABELS,
  OVERALL_LABELS,
  type EligibilityIndicator,
  type EligibilityOverall,
} from "./types";

/**
 * The system's verdict, wherever it appears.
 *
 * Colour carries meaning here, so it is deliberately restrained: green only
 * for the one verdict that means "worth a call today", amber for everything
 * that needs a human, grey for a form that was left half-answered. There is no
 * red, because there is no negative verdict — the ruleset cannot produce one,
 * and a red badge would be read as a rejection by whoever glances at the list.
 */

const OVERALL_TONE: Record<EligibilityOverall, string> = {
  preliminary_likely_eligible:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  needs_counsellor_review: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  more_information_required: "border-border bg-muted text-muted-foreground",
};

export function OverallBadge({ status }: { status: EligibilityOverall }) {
  return (
    <Badge variant="outline" className={cn("font-medium", OVERALL_TONE[status])}>
      {OVERALL_LABELS[status]}
    </Badge>
  );
}

const INDICATOR_TONE: Record<EligibilityIndicator, string> = {
  likely_meets: "text-emerald-600 dark:text-emerald-400",
  needs_review: "text-amber-600 dark:text-amber-400",
  insufficient_information: "text-muted-foreground",
};

/** One dimension, as a labelled line in the assessment panel. */
export function IndicatorRow({
  label,
  status,
}: {
  label: string;
  status: EligibilityIndicator;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-[13px] font-medium", INDICATOR_TONE[status])}>
        {INDICATOR_LABELS[status]}
      </span>
    </div>
  );
}

/** Document readiness, as a bar. Explicitly not a probability of anything. */
export function ReadinessBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full",
            value >= 80 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-muted-foreground/40",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}
