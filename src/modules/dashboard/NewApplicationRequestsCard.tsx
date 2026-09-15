import { Link, useNavigate } from "react-router";
import { ArrowRight, FileCheck2, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { CourseWithUniversityCell } from "@/modules/academic/CourseWithUniversityCell";
import { useApplications } from "@/modules/applications/hooks";
import { formatRelativeTime } from "@/utils/format";
import { ApplicationStatus } from "@/types/enums";

/**
 * Applications waiting for somebody to pick them up.
 *
 * ## Why this is the top of the dashboard
 *
 * A student pressing Submit is the one event in this product where the delay
 * is entirely Ignition's fault and entirely invisible: the application moves to
 * `ready_to_submit` and then sits there until a counsellor happens to open the
 * list. Nothing told anyone. This is the "situational awareness" the brief asks
 * for, reduced to the single question worth putting first — *is anything
 * waiting on us right now?*
 *
 * ## What it deliberately does not do
 *
 * It does not repeat the applications table. Six columns, five rows, one
 * action: enough to decide whether to act, not enough to work from. Everything
 * else is one click away, which is the correct division between a dashboard
 * and a screen.
 *
 * Unassigned ones are called out, because an application with no counsellor is
 * the one most likely to be missed — nobody's queue contains it.
 */

const PAGE_SIZE = 6;

export function NewApplicationRequestsCard() {
  const navigate = useNavigate();
  const { data, isLoading } = useApplications({
    status: ApplicationStatus.READY_TO_SUBMIT,
    limit: PAGE_SIZE,
    page: 1,
  });

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileCheck2}
        title="Nothing waiting"
        description="Applications a student has finished and handed over will appear here."
        className="border-none py-8"
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">{data?.total ?? items.length}</span> waiting
          for review
        </p>
        <Link
          to={`/applications?status=${ApplicationStatus.READY_TO_SUBMIT}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* A table on desktop, stacked rows on a phone. `overflow-x-auto` rather
          than a min-width that would push the page sideways. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="pb-2 pr-3 font-medium">Applicant</th>
              <th scope="col" className="pb-2 pr-3 font-medium">Course</th>
              <th scope="col" className="pb-2 pr-3 font-medium">Submitted</th>
              <th scope="col" className="pb-2 pr-3 font-medium">Counsellor</th>
              <th scope="col" className="pb-2 font-medium sr-only">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((application) => (
              <tr key={application.id} className="group">
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  <StudentNameCell userId={application.student_id} />
                </td>
                {/* The staff `ApplicationRead` carries `program_id` and not
                    the programme itself — unlike the student-facing shape,
                    which embeds a summary. This is the same cell the
                    applications list uses, so the two read identically and
                    share one cache entry per programme. */}
                <td className="max-w-[240px] py-2.5 pr-3 text-muted-foreground">
                  <CourseWithUniversityCell programId={application.program_id} />
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                  {formatRelativeTime(application.updated_at)}
                </td>
                <td className="py-2.5 pr-3">
                  {application.counsellor_id ? (
                    <StudentNameCell userId={application.counsellor_id} />
                  ) : (
                    // Not a dash. An unassigned application is the one most
                    // likely to be missed, so it is the one thing on this row
                    // that is allowed to shout.
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11.5px] font-medium text-warning">
                      <UserPlus className="h-3 w-3" /> Unassigned
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate(`/applications/${application.id}`)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
