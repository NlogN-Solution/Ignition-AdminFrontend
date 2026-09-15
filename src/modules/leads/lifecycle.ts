import type { LeadRead } from "./types";
import type { LeadStatus } from "@/types/enums";

/**
 * One lifecycle, one row.
 *
 * The console used to split leads across four tabs — Raw, Prospects, Clients,
 * Lost — each with its own column set. That made the same person four different
 * records depending on which tab you were standing in: their priority and source
 * were visible while they were raw and vanished once they qualified, their
 * conversion date appeared only under Clients, and the history of how they got
 * there lived nowhere. Worse, a student who registered on the portal landed
 * straight in Clients, so the tab that says "new business" never showed the
 * newest business.
 *
 * There is now one list and one row per person, and this file is the ladder that
 * row climbs. Nothing is thrown away as they move: the first thing we learned
 * about them is still on the row when they enrol.
 *
 * ## Why five steps and not six
 *
 * The backend's `LeadStatus` has six values and is unchanged — no migration, no
 * new column. `contacted` and `follow_up` are folded into a single "In touch"
 * step here because they are the same fact from a reader's point of view
 * (someone has spoken to them and it is not finished), and a rail with six
 * segments in a table cell is a rail nobody reads. The distinction still shows
 * on the row as the exact status, and on the lead's own page in full.
 *
 * `enrolled` is the one step that is NOT a lead status — it lives on the
 * application. It is on the ladder anyway because the brief is the whole
 * journey, and a client with an enrolled application is further along than one
 * without. The list cannot know it without a per-row join, so on the list it
 * renders as the dimmed step still ahead; the lead detail page, which already
 * loads applications, fills it in.
 */

export const LIFECYCLE_STEPS = ["new", "in_touch", "qualified", "client", "enrolled"] as const;
export type LifecycleStep = (typeof LIFECYCLE_STEPS)[number];

export const STEP_LABELS: Record<LifecycleStep, string> = {
  new: "New",
  in_touch: "In touch",
  qualified: "Qualified",
  client: "Client",
  enrolled: "Enrolled",
};

/** What the row says they are right now, in the words staff use. */
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New enquiry",
  contacted: "Contacted",
  follow_up: "Following up",
  qualified: "Qualified",
  converted: "Client",
  lost: "Closed — lost",
} as Record<LeadStatus, string>;

/**
 * How far up the ladder a status is.
 *
 * `lost` has no rung. It is not a stage, it is the journey stopping — see
 * `lifecycleOf`, which reports it separately so a caller can draw an ending
 * rather than a position.
 */
const STEP_INDEX: Record<LeadStatus, number> = {
  new: 0,
  contacted: 1,
  follow_up: 1,
  qualified: 2,
  converted: 3,
  lost: 0,
} as Record<LeadStatus, number>;

export interface Lifecycle {
  /** Index into LIFECYCLE_STEPS. Steps up to and including this one are done. */
  index: number;
  step: LifecycleStep;
  /** The precise status, which is finer than the step (Contacted vs Following up). */
  statusLabel: string;
  lost: boolean;
  /** Set only when the lead ended — the reason, ready to render. */
  lostReason: string | null;
  /** True once an application for this person reached `enrolled`. */
  enrolled: boolean;
}

export function lifecycleOf(lead: LeadRead, opts?: { enrolled?: boolean }): Lifecycle {
  const lost = lead.status === "lost";
  const enrolled = opts?.enrolled ?? false;
  // Enrolment outranks the lead's own status: someone can only enrol as a
  // client, and if the application says enrolled that is the newer fact.
  const index = enrolled ? 4 : STEP_INDEX[lead.status] ?? 0;

  return {
    index,
    step: LIFECYCLE_STEPS[index],
    statusLabel: STATUS_LABELS[lead.status] ?? lead.status,
    lost,
    lostReason: lead.lost_reason ?? null,
    enrolled,
  };
}

/**
 * The dated milestones this person has actually passed, oldest first.
 *
 * Only entries with a real timestamp are returned — an undated milestone is a
 * milestone that has not happened, and printing "Qualified —" states an absence
 * as a fact. This is what lets one row carry the whole history instead of the
 * tab you happen to be looking at.
 */
export function milestonesOf(lead: LeadRead): { label: string; at: string }[] {
  const entries: { label: string; at: string | null }[] = [
    { label: "Captured", at: lead.created_at },
    { label: "Qualified", at: lead.qualified_at },
    { label: "Became a client", at: lead.converted_at },
    { label: "Lost", at: lead.lost_at },
  ];
  return entries.filter((e): e is { label: string; at: string } => Boolean(e.at));
}
