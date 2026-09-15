import { Award, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApplicationRead } from "@/modules/applications/types";
import { ApplicationSnapshot } from "../overview/ApplicationSnapshot";
import { NextSteps } from "../overview/NextSteps";

/** Statuses at or past the offer — where recording an offer makes sense. */
const OFFER_STAGES: ApplicationRead["status"][] = [
  "offer_received",
  "offer_accepted",
  "cas_received",
  "visa_processing",
  "visa_approved",
  "enrolled",
];

/**
 * Where filing a CAS letter makes sense.
 *
 * From `offer_accepted`, not `cas_received`: the university issues the CAS once
 * the offer is accepted and the deposit clears, and the counsellor filing it is
 * usually the same action that moves the application to `cas_received`. Waiting
 * for the status to change first would mean filing the letter through a
 * different screen than the one that prompted for it.
 */
const CAS_STAGES: ApplicationRead["status"][] = [
  "offer_accepted",
  "cas_received",
  "visa_processing",
  "visa_approved",
  "enrolled",
];

/**
 * The default screen: what this application is, and what to do about it.
 *
 * It has lost two cards since the first pass. Quick Actions went because every
 * one of its buttons duplicated a control that already existed somewhere more
 * obvious — request document is on the Documents tab, add note on Notes, update
 * status and assign advisor in the header's Actions menu — and a panel of
 * shortcuts to things one click away is a panel earning its space in aliases.
 * Latest Update went because it was the first row of the Status History tab,
 * printed twice.
 *
 * What is left is the record and the next action, which is what a summary is.
 * The journey rail beside it answers "where are we" without either of them.
 */
export function ApplicationOverview({
  application,
  programName,
  universityName,
  canManage,
  onEdit,
  onAssignAdvisor,
  onRecordOffer,
  onRecordCas,
}: {
  application: ApplicationRead;
  programName: string | null;
  universityName: string | null;
  canManage: boolean;
  onEdit: () => void;
  onAssignAdvisor: () => void;
  onRecordOffer: () => void;
  onRecordCas: () => void;
}) {
  /**
   * The offer prompt only exists once an offer actually has. Showing "record
   * the offer" on a draft application would be inviting staff to file a
   * document that does not exist yet.
   */
  const atOffer = OFFER_STAGES.includes(application.status);
  const atCas = CAS_STAGES.includes(application.status);

  return (
    <div className="space-y-4">
      <ApplicationSnapshot
        application={application}
        programName={programName}
        universityName={universityName}
        canManage={canManage}
        onEdit={onEdit}
        onAssignAdvisor={onAssignAdvisor}
      />
      {canManage && atOffer && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card px-5 py-4 ring-1 ring-[var(--border)] sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
            >
              <Award className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-semibold text-foreground">Offer</h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {application.offer_received_date
                  ? "Recorded. You can still replace the letter or correct the date."
                  : "Record the date the university issued it and upload the letter. The student is notified."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onRecordOffer}>
            <Award className="h-3.5 w-3.5" />
            {application.offer_received_date ? "Update offer" : "Record offer"}
          </Button>
        </section>
      )}

      {/* CAS.

          Its own section rather than a line inside the offer one: a student can
          sit between an accepted offer and a CAS for weeks, it is the commonest
          place a UK application stalls, and until now the letter it is named
          after had no document type to be filed under — staff picked "Other"
          and the student's portal could not tell it from a bank statement. */}
      {canManage && atCas && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card px-5 py-4 ring-1 ring-[var(--border)] sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Upload className="h-4 w-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-semibold text-foreground">CAS</h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {application.cas_received_date
                  ? "Recorded. You can correct the date or replace the statement."
                  : "Record the date the university issued it and upload the statement. The applicant is notified and needs it to apply for the visa."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onRecordCas}>
            <Upload className="h-3.5 w-3.5" />
            {application.cas_received_date ? "Update CAS" : "Record CAS"}
          </Button>
        </section>
      )}

      <NextSteps status={application.status} />

    </div>
  );
}
