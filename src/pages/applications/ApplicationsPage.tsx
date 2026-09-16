import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Plus, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { LifecycleRail } from "@/components/shared/LifecycleRail";
import { InlineSelectCell } from "@/components/shared/InlineSelectCell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import {
  useApplications,
  useChangeApplicationStatusById,
  useStatusRequirements,
  useUpdateApplication,
} from "@/modules/applications/hooks";
import { AssignAdvisorDialog } from "@/modules/applications/detail/AssignAdvisorDialog";
import { applicationReference } from "@/modules/applications/reference";
import { ApplicationFormDialog } from "@/modules/applications/ApplicationFormDialog";
import {
  APPLICATION_PHASES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STAGE_FILTERS,
  applicationLifecycleOf,
} from "@/modules/applications/lifecycle";
import type { ApplicationRead } from "@/modules/applications/types";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { CourseWithUniversityCell } from "@/modules/academic/CourseWithUniversityCell";
import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { ApplicationStatus, UserRole } from "@/types/enums";
import { formatDate } from "@/utils/format";

/**
 * Applications — the same treatment as Leads, for the same reasons.
 *
 * This list used to show a `StatusBadge` with one of fourteen raw enum values in
 * it, plus two adjacent date columns ("Applied" and "Created") that are the same
 * date on most rows. You could read a row and still not know whether it was
 * nearly finished or had barely started.
 *
 * Now each row carries a `LifecycleRail` — Preparing → Submitted → Offer → Visa
 * → Enrolled — with the precise status as its caption, so position and state
 * arrive together. See `modules/applications/lifecycle.ts` for how the fourteen
 * statuses fold into five phases and why the four ending states draw where they
 * do rather than all at zero.
 *
 * The date column is now the one that answers "what happened most recently"
 * rather than two that answer nearly the same question, and the counsellor who
 * owns the file is on the row — the thing you actually need when a university
 * calls about it, and now assignable from the row itself.
 *
 * Tuition has gone. It is a finance figure on an admissions list: nobody
 * triaging applications sorts by it, and Payments owns the question properly.
 */
export function ApplicationsPage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = isManagerRole(role) || role === UserRole.COUNSELLOR;
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();

  /**
   * Assigning a counsellor without opening the application.
   *
   * The advisor could only be set from the detail page, so staffing a morning's
   * new applications meant opening each one, assigning, and navigating back.
   * The row holds the target and the mutation is bound to it — `useUpdateApplication`
   * needs an id at hook time, so it takes "" until a row is picked, which is
   * harmless because nothing fires until the dialog submits.
   */
  const [assignTarget, setAssignTarget] = useState<ApplicationRead | null>(null);
  const assignAdvisor = useUpdateApplication(assignTarget?.id ?? "");

  const params = useMemo(
    () => ({ page, limit: 20, status: status === "all" ? undefined : (status as ApplicationStatus) }),
    [page, status],
  );
  const { data, isLoading } = useApplications(params);

  /**
   * The most recent thing that happened, and what it was.
   *
   * The row's dates are a sparse record of the journey — `enrollment_date` is
   * set only once someone enrols, `visa_decision_date` only after a decision —
   * so the latest one that exists is the last real event. That is more useful
   * than `updated_at`, which moves when someone fixes a typo in the remarks.
   */
  function lastEvent(app: ApplicationRead): { label: string; at: string } | null {
    const events: { label: string; at: string | null }[] = [
      { label: "Created", at: app.created_at },
      { label: "Applied", at: app.application_date },
      { label: "Submitted", at: app.submission_date },
      { label: "Offer", at: app.offer_received_date },
      { label: "Visa applied", at: app.visa_applied_date },
      { label: "Visa decision", at: app.visa_decision_date },
      { label: "Enrolled", at: app.enrollment_date },
    ];
    const dated = events.filter((e): e is { label: string; at: string } => Boolean(e.at));
    if (dated.length === 0) return null;
    return dated.reduce((latest, e) => (new Date(e.at) > new Date(latest.at) ? e : latest));
  }

  const changeStage = useChangeApplicationStatusById();

  /**
   * Every status, with the three that cannot be set from here disabled.
   *
   * Offer, CAS and a visa decision record something a university issued, so the
   * backend refuses them on the plain status endpoint — they need a date and a
   * letter, collected by `ChangeStatusDialog` on the record itself
   * (`services/status_requirements.py`). The list shows them greyed with the
   * reason rather than hiding them, because "why can I not pick offer received"
   * is the question a missing option would leave unanswered.
   *
   * The set comes from the server's own config, so a fourth milestone added on
   * the backend disables itself here with no change to this file.
   */
  const { data: statusRequirements } = useStatusRequirements();
  const stageOptions = useMemo(
    () =>
      (Object.values(ApplicationStatus) as ApplicationStatus[]).map((value) => ({
        value,
        label: APPLICATION_STATUS_LABELS[value],
        disabledReason: (statusRequirements ?? []).some((r) => r.status === value)
          ? "Needs a date and a letter — open the application to record it"
          : undefined,
      })),
    [statusRequirements],
  );

  const columns = useMemo<ColumnDef<ApplicationRead, any>[]>(
    () => [
      {
        // First column: the reference staff quote on the phone. It leads
        // because it is how a row is named out loud — "IGN-2026-004821" —
        // and because scanning for one is the commonest reason to open this list.
        id: "reference",
        accessorKey: "id",
        header: "Application ID",
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono text-[13.5px] font-medium tracking-tight text-foreground">
            {applicationReference(row.original)}
          </span>
        ),
      },
      {
        accessorKey: "student_id",
        header: "Applicant",
        size: 200,
        cell: ({ getValue }) => (
          <div className="truncate text-[16px] font-semibold tracking-[-0.01em] text-foreground">
            <StudentNameCell userId={getValue<string>()} />
          </div>
        ),
      },
      {
        accessorKey: "program_id",
        header: "Course",
        size: 260,
        cell: ({ getValue }) => <CourseWithUniversityCell programId={getValue<string>()} />,
      },
      {
        accessorKey: "status",
        header: "Stage",
        size: 240,
        cell: ({ row }) => {
          const application = row.original;
          const cycle = applicationLifecycleOf(application.status);
          return (
            <div className="min-w-0">
              <LifecycleRail steps={APPLICATION_PHASES} index={cycle.index} ended={cycle.ended} />
              {/* The rail's caption, made editable in place — the same move as
                  the Owner column beside it, for the same reason: moving an
                  application along meant opening it, changing it and coming
                  back, once per row. */}
              <div className="mt-1">
                <InlineSelectCell
                  label="Set stage"
                  value={application.status}
                  isSaving={changeStage.isPending && changeStage.variables?.id === application.id}
                  options={stageOptions}
                  disabled={!canManage}
                  onChange={(status) => changeStage.mutate({ id: application.id, status })}
                >
                  <span className="text-[13px] text-muted-foreground">{cycle.statusLabel}</span>
                </InlineSelectCell>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "counsellor_id",
        header: "Counsellor",
        size: 170,
        cell: ({ row }) => {
          const id = row.original.counsellor_id;
          if (id) {
            return canManage ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignTarget(row.original);
                }}
                className="truncate rounded text-left text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                title="Reassign counsellor"
              >
                <StaffNameCell userId={id} />
              </button>
            ) : (
              <StaffNameCell userId={id} />
            );
          }
          if (!canManage) return <span className="text-muted-foreground">Unassigned</span>;
          return (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[13px]"
              onClick={(e) => {
                e.stopPropagation();
                setAssignTarget(row.original);
              }}
            >
              <UserPlus className="h-3.5 w-3.5" /> Assign
            </Button>
          );
        },
      },
      {
        id: "last_event",
        accessorKey: "updated_at",
        header: "Last milestone",
        size: 160,
        cell: ({ row }) => {
          const event = lastEvent(row.original);
          if (!event) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{event.label}</p>
              <p className="truncate text-[13px] text-muted-foreground">{formatDate(event.at)}</p>
            </div>
          );
        },
      },
    ],
    [canManage, changeStage, stageOptions],
  );

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Every application on one row each — from first draft through to enrolment."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New application
          </Button>
        }
      />

      <div className="mb-3">
        <ListToolbar
          filters={
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STAGE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        density="spacious"
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/applications/${row.id}`)}
        page={page}
        limit={20}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={FileText}
            title={status === "all" ? "No applications yet" : "Nothing at this stage"}
            description={
              status === "all"
                ? "Start one once a client is ready to apply to a course."
                : "Try a different stage, or clear the filter to see everything."
            }
            action={
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Create application
              </Button>
            }
            className="border-none py-20"
          />
        }
      />

      <ApplicationFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AssignAdvisorDialog
        open={Boolean(assignTarget)}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        currentId={assignTarget?.counsellor_id ?? null}
        isSaving={assignAdvisor.isPending}
        onAssign={(userId) =>
          assignAdvisor.mutate({ counsellor_id: userId }, { onSuccess: () => setAssignTarget(null) })
        }
      />
    </div>
  );
}
