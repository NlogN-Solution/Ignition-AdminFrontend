import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LifecycleRailProps {
  /** Every step, in order, oldest first. */
  steps: readonly string[];
  /** Index of the step currently reached. Steps before it are done. */
  index: number;
  /** The journey ended here rather than continuing. Draws the tail as closed. */
  ended?: boolean;
  /** What to call the state under the rail — finer than the step name. */
  caption?: string;
  /** A short note beside the caption, e.g. a lost reason or a date. */
  note?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Where something is in its lifecycle, as one object you can read across a room.
 *
 * The console used to answer this with a status pill: a coloured word, the same
 * size as every other word in the row, that told you the current state and
 * nothing about the shape of the journey — you could not see that "Qualified"
 * is two thirds of the way along, or that this person has been sitting at step
 * one for a month while the row under them is nearly done.
 *
 * The rail shows position and progress in the same object. Filled segments are
 * behind you, the current segment is accented and labelled, and what remains is
 * a hairline. It is used by both Leads and Applications because both are the
 * same question asked about different records, and answering it two different
 * ways is how a console stops feeling like one product.
 *
 * ## Accessibility
 *
 * The segments are decoration — `aria-hidden` — and the caption underneath is
 * real text carrying the same fact, so the row reads as "Qualified · step 3 of
 * 5" rather than as a run of unlabelled divs. Colour is never the only signal:
 * a finished journey also gets a tick, an ended one a cross.
 */
export function LifecycleRail({
  steps,
  index,
  ended = false,
  caption,
  note,
  size = "md",
  className,
}: LifecycleRailProps) {
  const complete = index >= steps.length - 1 && !ended;
  const barHeight = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div className={cn("min-w-0", className)}>
      <div aria-hidden className="flex items-center gap-1">
        {steps.map((step, i) => {
          const done = i < index;
          const current = i === index;
          return (
            <span
              key={step}
              className={cn(
                "flex-1 rounded-full transition-colors",
                barHeight,
                ended && current
                  ? "bg-danger"
                  : done
                    ? "bg-primary/45"
                    : current
                      ? complete
                        ? "bg-success"
                        : "bg-primary"
                      : "bg-border",
              )}
            />
          );
        })}
      </div>

      <div className={cn("mt-1.5 flex items-center gap-1.5", size === "sm" ? "text-[12.5px]" : "text-[13.5px]")}>
        {ended ? (
          <X className="h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={3} />
        ) : complete ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={3} />
        ) : null}
        <span
          className={cn(
            "truncate font-semibold",
            ended ? "text-danger" : complete ? "text-success" : "text-foreground",
          )}
        >
          {caption ?? steps[index]}
        </span>
        {note ? <span className="truncate text-muted-foreground">· {note}</span> : null}
      </div>

      {/* The same fact, for anything that cannot see the bars. */}
      <span className="sr-only">
        Step {index + 1} of {steps.length}
        {ended ? ", ended" : ""}
      </span>
    </div>
  );
}
