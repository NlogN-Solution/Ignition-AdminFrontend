import type { ReactNode } from "react";
import { CalendarClock, Check, FileText, Hash, Pencil, Phone, Plus, Ticket, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPLICATION_PHASES, applicationLifecycleOf } from "@/modules/applications/lifecycle";
import type { ApplicationRead } from "@/modules/applications/types";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * What the header cannot say: where this file is in time, and what it costs.
 *
 * ## Why it was flat
 *
 * It printed ten label/value pairs in a uniform grid. Four of them — applicant,
 * programme, university, status — are answered by `ApplicationHeader` two
 * inches above, in larger type, with an avatar and a badge. Of the remaining
 * six, five were usually "—". So the card read as a form printout of a mostly
 * empty form, and the eye had nothing to land on because every value was set in
 * the same 14.5px grey as every other.
 *
 * Restating the header louder would not have fixed that. Deciding what this
 * card is *for* did.
 *
 * ## What it is for
 *
 * Two questions, and they are the two the header structurally cannot answer.
 *
 * **Where is this file?** An application is not a status, it is a chronology:
 * opened, submitted, offer, CAS, visa, enrolled. Those five dates were five
 * unrelated rows, each independently "—", when they are in fact one sequence
 * with gaps in it. Drawn as a spine, the gaps become the information — "offer
 * in September, nothing since" is a sentence the old grid could not say.
 *
 * The phases are `APPLICATION_PHASES`, and the position comes from
 * `applicationLifecycleOf`, so this spine and the rail on the applications list
 * read one `PHASE_INDEX` and cannot disagree about where an application is.
 * (§23, and the reason `lifecycle.ts` exists at all.)
 *
 * **What does it cost?** Tuition, scholarship, and the number no column holds:
 * what is actually payable. That is the figure a counsellor is asked for on the
 * phone, and until now they did the subtraction in their head.
 *
 * ## Restraint
 *
 * The spine is the one loud thing. Everything around it is deliberately quiet —
 * no second accent, no card-in-a-card, no hover lift. An unreached step is a
 * hollow ring with its name, which reads as "not yet" rather than as missing
 * data; the money block says "No fees recorded yet" as a sentence rather than
 * printing three more dashes.
 */

interface Props {
  application: ApplicationRead;
  programName: string | null;
  universityName: string | null;
  /**
   * The applicant's number, for the `tel:` link.
   *
   * Threaded from the page rather than fetched here, because the page already
   * resolves the student for the Communication tab and gates that read on
   * `canBrowseApplicants`. A role that cannot resolve a user passes
   * `undefined` and gets "Not recorded", which is the same degradation the
   * rest of the console makes.
   */
  applicantPhone?: string | null;
  canManage: boolean;
  onEdit: () => void;
  onAssignAdvisor: () => void;
}

/**
 * The date each phase is stamped with, from the application's own columns.
 *
 * Visa shows the decision where there is one and the submission otherwise,
 * because "applied 3 Oct" and "decided 19 Nov" are the same phase at two very
 * different moments and the later one is the news.
 */
function phaseDates(application: ApplicationRead): (string | null)[] {
  return [
    application.application_date,
    application.submission_date,
    application.offer_received_date,
    application.cas_received_date,
    application.visa_decision_date ?? application.visa_applied_date,
    application.enrollment_date,
  ];
}

export function ApplicationSnapshot({
  application,
  programName,
  universityName,
  applicantPhone,
  canManage,
  onEdit,
  onAssignAdvisor,
}: Props) {
  const { index, statusLabel, ended } = applicationLifecycleOf(application.status);
  const dates = phaseDates(application);

  const dwell = dwellSentence({
    phase: ended ? statusLabel : APPLICATION_PHASES[index],
    since: dates[index] ?? application.updated_at,
    ended,
  });

  const tuition = application.tuition_fee;
  const scholarship = application.scholarship_amount;
  const payable = tuition === null ? null : tuition - (scholarship ?? 0);

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-[var(--border)]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-7">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">Application snapshot</h2>
          {/* How long it has sat where it is — the one fact on this card that
              no column holds and no other part of the page states. "In Offer
              for 34 days" is the sentence a manager is actually looking for;
              re-printing the programme and the university here would have been
              the third time they appear on one screen. */}
          <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{dwell}</p>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </Button>
        )}
      </header>

      <Chronology
        phases={APPLICATION_PHASES}
        dates={dates}
        reachedTo={index}
        ended={ended}
        endedLabel={statusLabel}
        // Reaching the last phase is arriving, not being in progress there. A
        // blue "6" on an enrolled student reads as "still working on it".
        complete={!ended && index === APPLICATION_PHASES.length - 1}
      />

      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="bg-card">
          <Particulars
            studentId={application.student_id}
            phone={applicantPhone}
            programName={programName}
            universityName={universityName}
          />
          <Money
            tuition={tuition}
            scholarship={scholarship}
            payable={payable}
            canManage={canManage}
            onEdit={onEdit}
          />
        </div>
        <Custody
          application={application}
          canManage={canManage}
          onAssignAdvisor={onAssignAdvisor}
        />
      </div>
    </section>
  );
}

/**
 * "In Offer for 34 days", and the two cases where that sentence is wrong.
 *
 * `since` is the current phase's own date where there is one, and `updated_at`
 * otherwise — an application in Preparing has no phase date at all until
 * somebody opens it, and "for 0 days" would be a fabrication rather than a
 * fallback.
 *
 * Deliberately days, not `formatRelativeTime`. "3 weeks ago" is right for a
 * feed and wrong here: the question is how long something has been sitting,
 * and a number staff can compare between two files is the answer to it.
 */
function dwellSentence({
  phase,
  since,
  ended,
}: {
  phase: string;
  since: string | null;
  ended: boolean;
}): string {
  if (!since) return ended ? phase : `In ${phase}`;

  const days = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000));
  if (Number.isNaN(days)) return ended ? phase : `In ${phase}`;

  if (ended) return days === 0 ? `${phase} today` : `${phase} ${days} day${days === 1 ? "" : "s"} ago`;
  if (days === 0) return `In ${phase} since today`;
  return `In ${phase} for ${days} day${days === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------- chronology --- */

function Chronology({
  phases,
  dates,
  reachedTo,
  ended,
  endedLabel,
  complete,
}: {
  phases: readonly string[];
  dates: (string | null)[];
  reachedTo: number;
  ended: boolean;
  endedLabel: string;
  complete: boolean;
}) {
  return (
    <div className="border-y border-border bg-[color-mix(in_oklab,var(--card)_92%,var(--foreground))] px-5 py-6 sm:px-7">
      {/* Horizontal from `sm`, a vertical timeline below it. A six-step rail
          squeezed into a phone is six illegible words; stacked, it is the same
          sequence read downward, which is how a timeline degrades honestly. */}
      <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0">
        {phases.map((phase, step) => {
          const reached = step <= reachedTo;
          const current = step === reachedTo && !complete;
          const date = dates[step];
          const stopped = ended && current;

          return (
            <li key={phase} className="relative flex gap-3 sm:min-w-0 sm:flex-1 sm:flex-col sm:gap-0">
              {/* The connector. Drawn behind the node on desktop and to its
                  left on mobile, coloured only as far as the file has got —
                  which is what makes an unreached phase read as "not yet"
                  rather than as an empty field. */}
              {step > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute sm:left-[calc(-50%+13px)] sm:right-[calc(50%+13px)] sm:top-[12px] sm:h-px sm:w-auto",
                    "left-[12.5px] top-0 h-4 w-px -translate-y-full sm:translate-y-0",
                    reached ? "bg-success/45" : "bg-border",
                    stopped && "bg-danger/45",
                  )}
                />
              )}

              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition-colors sm:mt-0",
                  stopped
                    ? "border-danger bg-danger text-[var(--danger-foreground)]"
                    : current
                      ? "border-primary bg-primary text-[var(--primary-foreground)] ring-4 ring-primary/15"
                      : reached
                        ? "border-success/40 bg-success/12 text-success"
                        : "border-border bg-card text-muted-foreground/50",
                )}
              >
                {reached && !current && !stopped ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : stopped ? "!" : step + 1}
              </span>

              <div className="min-w-0 pb-4 last:pb-0 sm:pb-0 sm:pt-2.5">
                <p
                  className={cn(
                    "truncate text-[13px] font-medium",
                    stopped ? "text-danger" : current ? "text-foreground" : reached ? "text-foreground/80" : "text-muted-foreground/70",
                  )}
                >
                  {stopped ? endedLabel : phase}
                </p>
                <p className="mt-0.5 truncate text-[12px] tabular-nums text-muted-foreground">
                  {date ? formatDate(date) : current ? "In progress" : "—"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}



/* ------------------------------------------------------------ particulars --- */

/**
 * Who it is for and what they applied to, at the head of the left column.
 *
 * These four facts also appear in `ApplicationHeader`, and that repetition is
 * deliberate: the header is chrome a reader scrolls past, and staff asked for
 * the card to stand on its own — a counsellor with the phone to their ear
 * wants the name, the number and the course in the same block as the money
 * they are being asked about, not split across the top of the page.
 *
 * So it earns the duplication by adding what the header does not have: the
 * number is a `tel:` link, which is the whole reason a contact number is worth
 * printing twice.
 */
function Particulars({
  studentId,
  phone,
  programName,
  universityName,
}: {
  studentId: string;
  phone?: string | null;
  programName: string | null;
  universityName: string | null;
}) {
  return (
    <div className="border-b border-border px-5 py-5 sm:px-7">
      <Caption>Applicant</Caption>
      <p className="mt-1.5 text-[15px] font-medium text-foreground">
        <StudentNameCell userId={studentId} />
      </p>
      {phone ? (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] tabular-nums text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Phone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {phone}
        </a>
      ) : (
        <p className="mt-0.5 text-[13px] text-muted-foreground">No phone number recorded</p>
      )}

      <div className="mt-4">
        <Caption>Applied to</Caption>
        {/* The course wraps rather than truncating. "Advanced Aesthetic and
            Restorative Dentistry (Top-up) MSc" cut at one line is three
            different courses at this university. */}
        <p className="mt-1.5 text-[14.5px] font-medium leading-snug text-foreground">
          {programName ?? "—"}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{universityName ?? "—"}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ money --- */

function Money({
  tuition,
  scholarship,
  payable,
  canManage,
  onEdit,
}: {
  tuition: number | null;
  scholarship: number | null;
  payable: number | null;
  canManage: boolean;
  onEdit: () => void;
}) {
  if (tuition === null && scholarship === null) {
    return (
      <div className="bg-card px-5 py-5 sm:px-7">
        <Caption>Fees</Caption>
        {/* Symmetrical with the advisor slot opposite: the two blanks on this
            card that are also jobs both offer the job. Prose telling someone
            to go and find "Edit details" left a tall empty column beside a
            panel twice its height. */}
        {canManage ? (
          <button
            type="button"
            onClick={onEdit}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-2.5 py-1.5 text-[13px] font-medium text-primary transition-colors hover:border-primary hover:bg-primary/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-3.5 w-3.5" /> Add tuition and Application Specifics
          </button>
        ) : (
          <p className="mt-2 text-[15px] text-muted-foreground">Not recorded</p>
        )}
        <p className="mt-1 max-w-[40ch] text-[12.5px] leading-relaxed text-muted-foreground">
          Fees usually arrive with the offer letter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card px-5 py-5 sm:px-7">
      <Caption>Fees</Caption>

      {/* The payable figure leads because it is the one a counsellor is asked
          for, and the one no column holds — tuition and scholarship are its
          working, so they are set below it at label size. */}
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
        {payable === null ? "—" : formatCurrency(payable)}
      </p>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground">
        {scholarship ? "Payable after scholarship" : "Tuition payable"}
      </p>

      <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-[13px]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Tuition</dt>
          <dd className="tabular-nums text-foreground">{tuition === null ? "—" : formatCurrency(tuition)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Scholarship</dt>
          <dd className={cn("tabular-nums", scholarship ? "text-success" : "text-muted-foreground")}>
            {scholarship ? `− ${formatCurrency(scholarship)}` : "None recorded"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ---------------------------------------------------------------- custody --- */

/** Who is handling it, and the references that identify it elsewhere. */
function Custody({
  application,
  canManage,
  onAssignAdvisor,
}: {
  application: ApplicationRead;
  canManage: boolean;
  onAssignAdvisor: () => void;
}) {
  return (
    <div className="bg-card px-5 py-5 sm:px-7">
      <Caption>Handling</Caption>

      <div className="mt-2">
        {application.counsellor_id ? (
          <p className="text-[15px] font-medium text-foreground">
            <StaffNameCell userId={application.counsellor_id} />
          </p>
        ) : canManage ? (
          // The only blank on this card that is also a job, so it offers the
          // job rather than a dash.
          <button
            type="button"
            onClick={onAssignAdvisor}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-2.5 py-1.5 text-[13px] font-medium text-primary transition-colors hover:border-primary hover:bg-primary/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <UserPlus className="h-3.5 w-3.5" /> Assign an advisor
          </button>
        ) : (
          <p className="text-[15px] text-muted-foreground">Unassigned</p>
        )}
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {application.counsellor_id ? "Advisor on this application" : "Nobody owns this file yet"}
        </p>
      </div>

      <dl className="mt-4 space-y-2 border-t border-border pt-3 text-[13px]">
        <Reference icon={Ticket} label="Offer type">
          {application.offer_type ? (
            <span className="capitalize text-foreground">{application.offer_type}</span>
          ) : (
            "—"
          )}
        </Reference>
        <Reference icon={Hash} label="CAS number">
          {application.cas_number ? (
            <span className="font-mono text-[12.5px] text-foreground">{application.cas_number}</span>
          ) : (
            "—"
          )}
        </Reference>
        <Reference icon={FileText} label="University reference">
          {application.university_application_id ? (
            <span className="font-mono text-[12.5px] text-foreground">{application.university_application_id}</span>
          ) : (
            "—"
          )}
        </Reference>
        {/* The student sees these on their application page too — Key
            Deadlines and Course Details. Edited through "Edit details". */}
        <Reference icon={CalendarClock} label="Application deadline">
          {application.application_deadline ? (
            <span className="tabular-nums text-foreground">{formatDate(application.application_deadline)}</span>
          ) : (
            "—"
          )}
        </Reference>
        <Reference icon={CalendarClock} label="Payment deadline">
          {application.payment_deadline ? (
            <span className="tabular-nums text-foreground">{formatDate(application.payment_deadline)}</span>
          ) : (
            "—"
          )}
        </Reference>
        <Reference icon={CalendarClock} label="Study mode">
          {application.study_mode ? <span className="text-foreground">{application.study_mode}</span> : "Course default"}
        </Reference>
      </dl>

    </div>
  );
}

/* --------------------------------------------------------------- fragments --- */

/** Sentence case, not tracked-out capitals: this is a heading, not a tag. */
function Caption({ children }: { children: ReactNode }) {
  return <h3 className="text-[12.5px] font-medium text-muted-foreground">{children}</h3>;
}

function Reference({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Hash;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 self-center" strokeWidth={2} aria-hidden />
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-muted-foreground">{children}</dd>
    </div>
  );
}
