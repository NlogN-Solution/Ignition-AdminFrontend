import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Clock, FileText, GraduationCap, Route, Sparkles, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { useApplication, useApplicationStatusHistory, useChangeApplicationStatus, useDeleteApplication } from "@/modules/applications/hooks";
import { useProgram, useUniversity } from "@/modules/academic/hooks";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { useApplicationWorkflow, useStartApplicationWorkflow } from "@/modules/application-workflow/hooks";
import { JourneyTimeline } from "@/modules/application-workflow/JourneyTimeline";
import { StepDetailSheet } from "@/modules/application-workflow/StepDetailSheet";
import { DocumentChecklistCard } from "@/modules/checklist/DocumentChecklistCard";
import { ApplicationStatus, UserRole } from "@/types/enums";
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, toTitleCase } from "@/utils/format";

export function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);

  const { data: application, isLoading } = useApplication(applicationId);
  const { data: history, isLoading: historyLoading } = useApplicationStatusHistory(applicationId);
  const { data: program } = useProgram(application?.program_id);
  const { data: university } = useUniversity(program?.university_id);
  const changeStatus = useChangeApplicationStatus(applicationId ?? "");
  const deleteApplication = useDeleteApplication();
  const { data: workflow, isLoading: workflowLoading } = useApplicationWorkflow(applicationId);
  const startWorkflow = useStartApplicationWorkflow(applicationId ?? "");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const selectedStep = workflow?.steps.find((s) => s.id === selectedStepId) ?? null;

  useEffect(() => {
    if (program) setLabel(program.name);
  }, [program, setLabel]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!application) {
    return <EmptyState icon={FileText} title="Application not found" description="It may have been deleted." />;
  }

  const canManage = isManagerRole(role) || role === "counsellor";
  const isStudent = role === UserRole.STUDENT;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/applications")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applications
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">{program?.name ?? "Application"}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {university?.name ?? "…"} • Created {formatDateTime(application.created_at)}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Change status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.values(ApplicationStatus).map((s) => (
                  <DropdownMenuItem key={s} disabled={s === application.status} onSelect={() => changeStatus.mutate({ status: s })}>
                    {toTitleCase(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {isManagerRole(role) && (
              <Button
                variant="outline"
                size="icon"
                className="text-danger hover:text-danger"
                onClick={() => {
                  if (confirm("Delete this application permanently?")) {
                    deleteApplication.mutate(application.id, { onSuccess: () => navigate("/applications") });
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">Overview</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={GraduationCap} label="Applicant" value={<StudentNameCell userId={application.student_id} />} />
              <InfoRow icon={Wallet} label="Tuition fee" value={application.tuition_fee ? formatCurrency(application.tuition_fee) : "—"} />
              <InfoRow
                icon={Wallet}
                label="Scholarship"
                value={application.scholarship_amount ? formatCurrency(application.scholarship_amount) : "—"}
              />
              <InfoRow icon={Clock} label="Application date" value={formatDate(application.application_date)} />
              <InfoRow icon={Clock} label="Submission date" value={formatDate(application.submission_date)} />
              <InfoRow icon={Clock} label="Offer received" value={formatDate(application.offer_received_date)} />
              <InfoRow icon={Clock} label="Visa applied" value={formatDate(application.visa_applied_date)} />
              <InfoRow icon={Clock} label="Visa decision" value={formatDate(application.visa_decision_date)} />
            </div>
            {application.remarks && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-foreground">{application.remarks}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-foreground">Status history</h2>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
          ) : (
            <ol className="space-y-4">
              {history.map((entry, idx) => (
                <li key={entry.id} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="h-2.5 w-2.5" />
                    </span>
                    {idx < history.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-[13px] font-medium text-foreground">
                      {entry.old_status ? `${toTitleCase(entry.old_status)} → ` : ""}
                      {toTitleCase(entry.new_status)}
                    </p>
                    {entry.remarks && <p className="text-xs text-muted-foreground">{entry.remarks}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(entry.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">Application journey</h2>
            {workflow && (
              <span className="text-xs text-muted-foreground">
                {workflow.steps.filter((s) => s.status === "completed").length}/{workflow.steps.length} steps complete
              </span>
            )}
          </div>

          {workflowLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !workflow ? (
            <EmptyState
              icon={Route}
              title="No journey started yet"
              description={
                isStudent
                  ? "Your counsellor hasn't started the application journey yet — check back soon."
                  : "Starting a journey picks the right template automatically based on the destination country, and seeds the document checklist."
              }
              action={
                isStudent ? undefined : (
                  <Button size="sm" disabled={startWorkflow.isPending} onClick={() => startWorkflow.mutate(undefined)}>
                    <Sparkles className="h-3.5 w-3.5" /> Start journey
                  </Button>
                )
              }
              className="border-none py-10"
            />
          ) : (
            <JourneyTimeline steps={workflow.steps} onSelectStep={(step) => setSelectedStepId(step.id)} />
          )}
        </div>

        <DocumentChecklistCard applicationId={application.id} studentId={application.student_id} />
      </div>

      <StepDetailSheet
        applicationId={application.id}
        step={selectedStep}
        open={Boolean(selectedStepId)}
        onOpenChange={(open) => !open && setSelectedStepId(null)}
        readOnly={isStudent}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className="text-foreground">{value}</div>
      </div>
    </div>
  );
}
