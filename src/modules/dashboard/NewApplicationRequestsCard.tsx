import { FileCheck2 } from "lucide-react";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { StudentMonogram } from "@/modules/users/StudentMonogram";
import { CourseNameCell } from "@/modules/academic/CourseNameCell";
import { useApplications } from "@/modules/applications/hooks";
import { ApplicationStatus } from "@/types/enums";
import { ArrivalsCard, type ArrivalRow } from "./ArrivalsCard";

/**
 * Applications waiting for somebody to pick them up.
 *
 * ## Why this is the top of the dashboard
 *
 * A student pressing Apply is the one event in this product where the delay is
 * entirely Ignition's fault and entirely invisible: the application is created
 * as `requested` and then sits there until a counsellor happens to open the
 * list. Nothing told anyone. This is the "situational awareness" the brief asks
 * for, reduced to the single question worth putting first — *is anything
 * waiting on us right now?*
 *
 * It counts `requested`, which is the queue itself. It used to count
 * `ready_to_submit` — students who had already been accepted and had finished
 * their part — which is a real queue but a later and smaller one, and it meant
 * the card named "New application requests" was the one place a new request
 * did not appear.
 *
 * ## What it stopped doing
 *
 * It used to be a six-column table of the five oldest, with a Review button on
 * each row: the applications list, printed on the dashboard, one page short.
 * Two screens showing the same rows means the dashboard is where people start
 * working, and the dashboard is a bad place to work — no filters, no sorting,
 * no bulk anything. It is three names and a count now, beside the
 * registrations card and in the same shape, and Review is where reviewing
 * happens.
 *
 * The one thing the table said that a name does not is which applications have
 * no counsellor, and that is the one most likely to be missed because nobody's
 * queue contains it. It survives as the count in the subtitle.
 */

const WINDOW_SIZE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

function countInWindow(dates: string[], fromDaysAgo: number, toDaysAgo: number) {
  const now = Date.now();
  return dates.filter((iso) => {
    const age = now - new Date(iso).getTime();
    return age >= fromDaysAgo * DAY_MS && age < toDaysAgo * DAY_MS;
  }).length;
}

export function NewApplicationRequestsCard() {
  /**
   * A working set rather than one page of five.
   *
   * The card shows three, but the two seven-day windows behind the delta have
   * to be counted from rows, and `updated_at` is the only timestamp this shape
   * carries. Fifty is enough for a fortnight at any volume this business has
   * seen; past that the delta understates rather than invents.
   */
  const { data, isLoading } = useApplications({
    status: ApplicationStatus.REQUESTED,
    limit: WINDOW_SIZE,
    page: 1,
  });

  const items = data?.items ?? [];
  const sorted = [...items].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
  const dates = sorted.map((a) => a.updated_at);
  const unassigned = items.filter((a) => !a.counsellor_id).length;

  const rows: ArrivalRow[] = sorted.map((application) => ({
    id: application.id,
    name: <StudentNameCell userId={application.student_id} />,
    monogram: <StudentMonogram userId={application.student_id} />,
    detail: <CourseNameCell programId={application.program_id} />,
    at: application.updated_at,
    to: `/applications/${application.id}`,
  }));

  const waiting = data?.total ?? items.length;

  return (
    <ArrivalsCard
      icon={FileCheck2}
      tone="success"
      title="New application requests"
      subtitle={
        unassigned > 0
          ? `${waiting} waiting to be accepted · ${unassigned} with no counsellor`
          : `${waiting} waiting to be accepted`
      }
      count={countInWindow(dates, 0, 7)}
      previous={countInWindow(dates, 7, 14)}
      rows={rows}
      isLoading={isLoading}
      emptyText="Nothing waiting. Applications students start from a course page appear here until a counsellor accepts them."
      viewAllTo={`/applications?status=${ApplicationStatus.REQUESTED}`}
    />
  );
}
