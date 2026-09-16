import { Check, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The one thing to do with an application nobody has accepted yet.
 *
 * A student opening an application from a course page creates it as
 * `requested`. Until a counsellor accepts it, no work has been agreed to and
 * the student has been told as much — so the Overview leads with the decision
 * rather than with a snapshot of a file that does not exist yet.
 *
 * Accepting moves it to `draft`, which is where "Preparing" starts, and writes
 * the transition to status history with the counsellor against it. Declining
 * is the ordinary status change to `rejected`, so it lives in the Actions menu
 * with every other status and is not given a button of equal weight here: the
 * default answer to a student who wants to apply is yes.
 */
export function AcceptRequest({
  onAccept,
  isAccepting,
}: {
  onAccept: () => void;
  isAccepting: boolean;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Inbox className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-foreground">This application is waiting for you</h2>
          <p className="mt-0.5 max-w-[70ch] text-[13.5px] leading-relaxed text-muted-foreground">
            The student started it themselves and nobody has picked it up yet. Accepting it starts the
            journey and lets them hand over their documents; until then they see that it is with us.
          </p>
        </div>
      </div>
      <Button className="shrink-0 gap-1.5" onClick={onAccept} disabled={isAccepting}>
        {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Accept request
      </Button>
    </section>
  );
}
