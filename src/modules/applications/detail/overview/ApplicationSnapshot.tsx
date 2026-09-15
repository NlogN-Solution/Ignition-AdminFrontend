import type { ReactNode } from "react";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Pencil,
  Percent,
  Plane,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import type { ApplicationRead } from "@/modules/applications/types";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { toneForStatus } from "@/utils/statusTone";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Everything true about this application, in one card.
 *
 * The old Overview put each field in an `InfoRow` inside a 2-column grid and
 * then repeated dates that mean nothing to a reader scanning for one answer
 * ("Submission date", "Visa applied", "Visa decision" — five date rows in a
 * row). This is the same data as a three-band grid, grouped by the question it
 * answers: who and what, then money and dates, then who is handling it.
 *
 * Values that are absent render "—", once, not "N/A" repeatedly. A missing
 * advisor is the exception: it is the only blank on this card that is also a
 * job, so it offers the action instead of a dash.
 *
 * ## One grid, not three bands
 *
 * It was three `dl` blocks each with its own 20px of vertical padding and a
 * divider between them, which on a laptop pushed the last two fields — visa
 * status and the advisor, the two a counsellor is most likely to act on — below
 * the fold. The grouping was for the author's benefit, not the reader's: nobody
 * scanning a record needs a rule drawn between "offer received" and "visa
 * status". It is now a single grid that wraps at whatever width it has, so
 * every field is on screen at once.
 */

interface Props {
  application: ApplicationRead;
  programName: string | null;
  universityName: string | null;
  canManage: boolean;
  onEdit: () => void;
  onAssignAdvisor: () => void;
}

export function ApplicationSnapshot({
  application,
  programName,
  universityName,
  canManage,
  onEdit,
  onAssignAdvisor,
}: Props) {
  const tone = toneForStatus(application.status);

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-[var(--border)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-primary/10 text-primary ring-1 ring-primary/15"
          >
            <FileText className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">Application Snapshot</h2>
            <p className="text-[12.5px] text-muted-foreground">Everything recorded against this application</p>
          </div>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </Button>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 sm:px-6 md:grid-cols-3 xl:grid-cols-5">
        <Field icon={User} label="Applicant">
          <StudentNameCell userId={application.student_id} />
        </Field>
        <Field icon={BookOpen} label="Program">
          {programName ?? <Skeleton className="h-4 w-32" />}
        </Field>
        <Field icon={Building2} label="University">
          {universityName ?? <Skeleton className="h-4 w-32" />}
        </Field>
        <Field icon={BadgeCheck} label="Application status" iconClassName={TONE_ICON[tone]}>
          <span className={cn("font-medium", TONE_TEXT[tone])}>{APPLICATION_STATUS_LABELS[application.status]}</span>
        </Field>
        <Field icon={Users} label="Assigned advisor">
          {application.counsellor_id ? (
            <StaffNameCell userId={application.counsellor_id} />
          ) : canManage ? (
            <button
              type="button"
              onClick={onAssignAdvisor}
              className="font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              Assign advisor
            </button>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </Field>

        <Field icon={CalendarDays} label="Application date">
          {dash(formatDate(application.application_date))}
        </Field>
        <Field icon={CalendarDays} label="Offer received">
          {dash(formatDate(application.offer_received_date))}
        </Field>
        <Field icon={Plane} label="Visa status">
          {visaStatusOf(application)}
        </Field>
        <Field icon={CreditCard} label="Tuition fee">
          {application.tuition_fee ? (
            <span className="tabular-nums">{formatCurrency(application.tuition_fee)}</span>
          ) : (
            "—"
          )}
        </Field>
        <Field icon={Percent} label="Scholarship">
          {application.scholarship_amount ? (
            <span className="tabular-nums text-success">{formatCurrency(application.scholarship_amount)}</span>
          ) : (
            "—"
          )}
        </Field>
      </dl>
    </section>
  );
}

/**
 * Visa progress, read off the dates the application already stores rather than
 * from a separate field — there isn't one. The dates are the record of what
 * happened, so they are the honest source.
 */
function visaStatusOf(application: ApplicationRead): string {
  if (application.status === "visa_approved") return "Approved";
  if (application.status === "visa_rejected") return "Refused";
  if (application.visa_decision_date) return `Decided ${formatDate(application.visa_decision_date)}`;
  if (application.visa_applied_date) return `Applied ${formatDate(application.visa_applied_date)}`;
  return "Not yet applied";
}

const dash = (value: string | null | undefined) => (value && value !== "—" ? value : "—");

const TONE_TEXT: Record<string, string> = {
  neutral: "text-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const TONE_ICON: Record<string, string> = {
  neutral: "text-muted-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

function Field({
  icon: Icon,
  label,
  iconClassName,
  children,
}: {
  icon: LucideIcon;
  label: string;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClassName ?? "text-muted-foreground")} strokeWidth={2} aria-hidden />
      <div className="min-w-0">
        <dt className="text-[12px] text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words text-[14.5px] text-foreground">{children}</dd>
      </div>
    </div>
  );
}
