import { ApplicationStatus } from "@/types/enums";

/**
 * An application's journey, as five things that actually happen.
 *
 * The backend's `ApplicationStatus` has fourteen values. All fourteen are real
 * and none are going away — they are what a counsellor sets and what the
 * student's portal reads — but fourteen is a vocabulary, not a journey, and a
 * list that renders one of fourteen coloured words tells you where a row is only
 * if you have memorised the order. Nobody can see that `under_review` is ahead
 * of `documents_pending`, or that `visa_processing` is nearly done.
 *
 * So the list groups them into the five phases people describe on the phone:
 *
 *   Preparing → Submitted → Offer → Visa → Enrolled
 *
 * The exact status still shows as the caption under the rail, so nothing is
 * hidden — you get the position *and* the precise state in one object.
 *
 * ## Endings
 *
 * `withdrawn`, `rejected`, `offer_declined` and `visa_rejected` are not phases.
 * They are the journey stopping, at four different points. `ENDED_AT` records
 * where each one stops so the rail can draw a red tail at the right place rather
 * than at the start — a visa refusal is a long way further along than a
 * withdrawal at draft, and drawing them identically would lose that.
 */

/**
 * `Requested` leads, and it is not cosmetic.
 *
 * A student opening an application from a course page used to land in
 * "Preparing", which is a claim that Ignition had started work. It had not —
 * nobody had looked at it. The phase exists so the rail can say "waiting on
 * us" instead, and so a counsellor accepting the request is a visible step
 * rather than a status that was already set.
 */
export const APPLICATION_PHASES = [
  "Requested",
  "Preparing",
  "Submitted",
  "Offer",
  "CAS",
  "Visa",
  "Enrolled",
] as const;

/**
 * CAS sits between Offer and Visa because that is the order it happens in, and
 * it is its own phase rather than part of Offer because a student can sit in it
 * for weeks: the university issues the Confirmation of Acceptance for Studies
 * only after the offer is accepted and the deposit clears, and no UK Student
 * visa can be applied for without that number. Folding it into "Offer" would
 * have hidden the commonest place a UK application actually stalls.
 */
const PHASE_INDEX: Record<ApplicationStatus, number> = {
  requested: 0,
  draft: 1,
  documents_pending: 1,
  ready_to_submit: 1,
  submitted: 2,
  under_review: 2,
  offer_received: 3,
  offer_accepted: 3,
  cas_received: 4,
  visa_processing: 5,
  visa_approved: 5,
  enrolled: 6,
  // Endings: the index is where they stopped, not a phase they reached.
  offer_declined: 3,
  visa_rejected: 5,
  withdrawn: 1,
  rejected: 2,
};

const ENDED: ApplicationStatus[] = [
  ApplicationStatus.OFFER_DECLINED,
  ApplicationStatus.VISA_REJECTED,
  ApplicationStatus.WITHDRAWN,
  ApplicationStatus.REJECTED,
];

/** What the caption says. Plainer than the raw enum, same meaning. */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  requested: "Requested",
  draft: "Draft",
  documents_pending: "Documents Pending",
  ready_to_submit: "Ready to Submit",
  submitted: "Submitted",
  under_review: "Under Review",
  offer_received: "Offer Received",
  offer_accepted: "Offer Accepted",
  offer_declined: "Offer Declined",
  cas_received: "CAS Received",
  visa_processing: "Visa in Process",
  visa_approved: "Visa Approved",
  visa_rejected: "Visa Refused",
  enrolled: "Enrolled",
  withdrawn: "Withdrawn",
  rejected: "Rejected",
};

export interface ApplicationLifecycle {
  index: number;
  phase: string;
  statusLabel: string;
  ended: boolean;
}

export function applicationLifecycleOf(status: ApplicationStatus): ApplicationLifecycle {
  const index = PHASE_INDEX[status] ?? 0;
  return {
    index,
    phase: APPLICATION_PHASES[index],
    statusLabel: APPLICATION_STATUS_LABELS[status] ?? status,
    ended: ENDED.includes(status),
  };
}

/**
 * The status filter, grouped the way the rail is.
 *
 * A flat list of fourteen statuses in a dropdown is the same problem as fourteen
 * badges: you cannot pick "everything with an offer" without knowing which three
 * values that means. These are the questions people ask.
 */
export const APPLICATION_STAGE_FILTERS = [
  { value: "all", label: "All stages" },
  { value: ApplicationStatus.REQUESTED, label: "Requested" },
  { value: ApplicationStatus.DOCUMENTS_PENDING, label: "Documents pending" },
  { value: ApplicationStatus.SUBMITTED, label: "Submitted" },
  { value: ApplicationStatus.UNDER_REVIEW, label: "Under review" },
  { value: ApplicationStatus.OFFER_RECEIVED, label: "Offer received" },
  { value: ApplicationStatus.CAS_RECEIVED, label: "CAS received" },
  { value: ApplicationStatus.VISA_PROCESSING, label: "Visa in process" },
  { value: ApplicationStatus.ENROLLED, label: "Enrolled" },
  { value: ApplicationStatus.WITHDRAWN, label: "Withdrawn" },
] as const;

/* ------------------------------------------------------------ staff journey --- */

/**
 * The five stages the staff workspace tracks an application through.
 *
 * Deliberately the same five as `APPLICATION_PHASES`, named the way the
 * admissions team says them out loud rather than the way the list column needs
 * them to fit. Both derive from one `PHASE_INDEX`, so the strip on the detail
 * page and the rail on the list can never disagree about where an application
 * is — which is the whole reason this file exists rather than a conditional in
 * each component (see §23 of the redesign brief).
 */
export const JOURNEY_STAGES = [
  "Requested",
  "Profile & Documents",
  "University Application",
  "Offer & Acceptance",
  "CAS",
  "Visa Application",
  "Pre-departure",
] as const;

export type JourneyStageState = "completed" | "current" | "pending" | "ended";

export interface JourneyStage {
  name: string;
  state: JourneyStageState;
  /** What the stage is doing right now — the small line under its name. */
  caption: string;
}

/**
 * The progress strip, derived from one canonical status.
 *
 * Stages before the current one are `completed`; the current one carries the
 * precise status as its caption so the strip says "Offer Received" rather than
 * the generic "Offer & Acceptance"; everything after is `pending`.
 *
 * An ended application (withdrawn, rejected, declined, refused) marks the stage
 * it stopped at rather than showing it as in progress — staff need to see that
 * the journey is over, not that it is halfway.
 */
export function journeyStagesFor(status: ApplicationStatus): JourneyStage[] {
  const { index, ended, statusLabel } = applicationLifecycleOf(status);

  return JOURNEY_STAGES.map((name, i) => {
    if (i < index) return { name, state: "completed" as const, caption: "Completed" };
    if (i === index) {
      return {
        name,
        state: ended ? ("ended" as const) : ("current" as const),
        caption: statusLabel,
      };
    }
    return { name, state: "pending" as const, caption: "Pending" };
  });
}

/**
 * What the staff member should do next, in one sentence.
 *
 * Written per stage rather than per status: the fourteen statuses collapse to
 * five situations, and a counsellor reading "Monitor university updates" does
 * not need it worded differently for `submitted` and `under_review`. Ended
 * applications get their own line because "what next" is genuinely different
 * when there is no next.
 */
export function nextStepFor(status: ApplicationStatus): { title: string; body: string } {
  const { index, ended } = applicationLifecycleOf(status);

  if (ended) {
    return {
      title: "This application has ended",
      body: `It is recorded as ${APPLICATION_STATUS_LABELS[status].toLowerCase()}. Nothing further is required here — check the student's other applications, or start a new one if they are still going ahead.`,
    };
  }

  const byStage = [
    "The student asked to apply and nobody has picked this up yet. Accept the request to start work on it, or decline it if the course is not realistic for them.",
    "Collect the outstanding documents before progressing the application.",
    "Monitor university updates and record any correspondence against this application.",
    "Support the student with offer acceptance, then chase the university for the CAS.",
    "CAS is issued. Check the details against the passport, then start the visa application.",
    "Track visa progress and confirm all required evidence has been submitted.",
    "Complete final pre-departure checks and student preparation.",
  ];

  return { title: "Next steps", body: byStage[index] ?? byStage[0] };
}
