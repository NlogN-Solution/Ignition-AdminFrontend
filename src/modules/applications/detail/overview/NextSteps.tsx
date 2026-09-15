import { Info } from "lucide-react";
import { nextStepFor } from "@/modules/applications/lifecycle";
import type { ApplicationStatus } from "@/types/enums";

/**
 * "What should I do next", computed from the application's own status.
 *
 * The copy lives in `nextStepFor` rather than here, so the sentence a
 * counsellor reads and the stage the progress strip highlights come from one
 * mapping and cannot drift (§23). This component only decides how to present
 * it. The "View Journey" button it used to carry is gone with the Journey tab:
 * the journey is now a permanent rail to the right of this card, so sending
 * someone to it would be pointing at something already on screen.
 */
export function NextSteps({ status }: { status: ApplicationStatus }) {
  const { title, body } = nextStepFor(status);

  return (
    <section className="rounded-2xl bg-card px-5 py-4 ring-1 ring-[var(--border)] sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-info/10 text-info"
        >
          <Info className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 max-w-[90ch] text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
    </section>
  );
}
