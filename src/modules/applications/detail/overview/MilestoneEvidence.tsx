import { Award, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import type { ApplicationRead, StatusRequirement } from "@/modules/applications/types";
import { ApplicationStatus } from "@/types/enums";

/**
 * One card for everything a university has issued against this application.
 *
 * ## What it replaces
 *
 * Two standing sections, "Offer" and "CAS", each a full-width panel with an
 * icon, a heading, a sentence and a button. They appeared from `offer_received`
 * and `offer_accepted` onwards respectively and then never left, so an
 * application at `enrolled` carried two permanent prompts to record things
 * recorded months earlier, and for most of the lifecycle the Overview tab was
 * mostly boxes asking for paperwork rather than the record it is supposed to
 * summarise.
 *
 * It is one section now, and it earns its place from the status rather than
 * standing there regardless:
 *
 *   - **The thing the current status is actually asking for** gets the button.
 *     At `offer_received` that is the offer; at `offer_accepted` it is the CAS,
 *     because the university issues one as soon as the offer is accepted and
 *     the deposit clears, and waiting for `cas_received` would mean filing the
 *     letter from a different screen than the one that prompted for it.
 *   - **Everything already on file** is a one-line entry with a quiet Update,
 *     so a mistyped date is still correctable and nothing is lost.
 *   - **Nothing to show, nothing rendered.** A draft application does not get
 *     invited to file an offer that does not exist.
 *
 * The usual way to record a milestone is no longer this card at all — changing
 * the status collects the date and the letter inline (`ChangeStatusDialog`).
 * This is the correction path, and the safety net for a status that was moved
 * before the letter arrived.
 *
 * ## It is driven by the server's config
 *
 * The requirements come from `GET /applications/status-requirements`. This
 * file knows which *status* asks for which milestone, and nothing about what a
 * milestone contains — no field names, no document types, no labels.
 */

/**
 * The milestone the application is currently waiting on, per status.
 *
 * Deliberately absent: `visa_processing`. The milestone on the other side of it
 * is `visa_approved`, and offering a button that records an approval is how a
 * refusal gets filed as one.
 */
const ASKING_FOR: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  [ApplicationStatus.OFFER_RECEIVED]: ApplicationStatus.OFFER_RECEIVED,
  [ApplicationStatus.OFFER_ACCEPTED]: ApplicationStatus.CAS_RECEIVED,
  [ApplicationStatus.CAS_RECEIVED]: ApplicationStatus.CAS_RECEIVED,
  [ApplicationStatus.VISA_APPROVED]: ApplicationStatus.VISA_APPROVED,
};

const ICONS: Partial<Record<ApplicationStatus, typeof Award>> = {
  [ApplicationStatus.OFFER_RECEIVED]: Award,
  [ApplicationStatus.CAS_RECEIVED]: Upload,
};

function recordedOn(application: ApplicationRead, requirement: StatusRequirement): string | null {
  const field = requirement.required_date_field;
  if (!field) return null;
  const value = (application as unknown as Record<string, string | null>)[field];
  return value ? value.slice(0, 10) : null;
}

export function MilestoneEvidence({
  application,
  requirements,
  onRecord,
}: {
  application: ApplicationRead;
  requirements: StatusRequirement[];
  onRecord: (status: ApplicationStatus) => void;
}) {
  const asking = ASKING_FOR[application.status];
  const pending = asking ? requirements.find((item) => item.status === asking) : undefined;
  const pendingDate = pending ? recordedOn(application, pending) : null;

  // Anything with a date already against it, minus whatever is holding the
  // button — that one is described by the prompt above it instead.
  const recorded = requirements
    .map((requirement) => ({ requirement, date: recordedOn(application, requirement) }))
    .filter((entry) => entry.date && entry.requirement.status !== pending?.status);

  if (!pending && recorded.length === 0) return null;

  const Icon = (pending && ICONS[pending.status as ApplicationStatus]) ?? Award;

  return (
    <section className="rounded-2xl bg-card px-5 py-4 ring-1 ring-[var(--border)] sm:px-6">
      {pending && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-semibold text-foreground">
                {APPLICATION_STATUS_LABELS[pending.status as ApplicationStatus]}
              </h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {pendingDate
                  ? "Recorded. You can still replace the letter or correct the date."
                  : pending.prompt}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => onRecord(pending.status as ApplicationStatus)}
          >
            <Icon className="h-3.5 w-3.5" />
            {pendingDate ? "Update" : "Record"}
          </Button>
        </div>
      )}

      {recorded.length > 0 && (
        <ul className={pending ? "mt-4 space-y-1 border-t border-border pt-3" : "space-y-1"}>
          {recorded.map(({ requirement, date }) => (
            <li key={requirement.status} className="flex items-center justify-between gap-3 py-0.5">
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
                <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                <span className="truncate">
                  {APPLICATION_STATUS_LABELS[requirement.status as ApplicationStatus]}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground/80">{date}</span>
              </span>
              <button
                type="button"
                onClick={() => onRecord(requirement.status as ApplicationStatus)}
                className="shrink-0 text-[12.5px] font-medium text-primary hover:underline"
              >
                Update
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
