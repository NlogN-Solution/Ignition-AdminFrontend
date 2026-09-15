import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useAuthStore } from "@/services/authStore";
import { canBrowseApplicants, isManagerRole } from "@/constants/permissions";
import {
  useApplication,
  useApplicationStatusHistory,
  useChangeApplicationStatus,
  useRecordMilestone,
  useStatusRequirements,
  useDeleteApplication,
  useUpdateApplication,
} from "@/modules/applications/hooks";
import { useProgram, useUniversity } from "@/modules/academic/hooks";
import { useUser } from "@/modules/users/hooks";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import {
  useApplicationWorkflow,
  useStartApplicationWorkflow,
  useUpdateWorkflowStep,
} from "@/modules/application-workflow/hooks";
import { StepDetailSheet } from "@/modules/application-workflow/StepDetailSheet";
import { ApplicationHeader } from "@/modules/applications/detail/ApplicationHeader";
import { ApplicationJourney } from "@/modules/applications/detail/tabs/ApplicationJourney";
import {
  ApplicationSectionNav,
  isApplicationTab,
  type ApplicationTab,
} from "@/modules/applications/detail/ApplicationSectionNav";
import { AssignAdvisorDialog } from "@/modules/applications/detail/AssignAdvisorDialog";
import { ChangeStatusDialog } from "@/modules/applications/detail/ChangeStatusDialog";
import { EditApplicationDialog } from "@/modules/applications/detail/EditApplicationDialog";
import { RecordMilestoneDialog } from "@/modules/applications/detail/RecordMilestoneDialog";
import { ApplicationActivity } from "@/modules/applications/detail/tabs/ApplicationActivity";
import { applicationReference } from "@/modules/applications/reference";
import { ApplicationCommunication } from "@/modules/applications/detail/tabs/ApplicationCommunication";
import { ApplicationDocuments } from "@/modules/applications/detail/tabs/ApplicationDocuments";
import { ApplicationNotes } from "@/modules/applications/detail/tabs/ApplicationNotes";
import { ApplicationOverview } from "@/modules/applications/detail/tabs/ApplicationOverview";
import { ApplicationStatusHistory } from "@/modules/applications/detail/tabs/ApplicationStatusHistory";
import { ApplicationStatus, UserRole } from "@/types/enums";

/**
 * One application, one focused workspace.
 *
 * ## What changed
 *
 * This page used to render Overview, Status History, Application Journey and
 * the document checklist all at once, in a pair of three-column grids. Four
 * answers before a question had been asked, and whichever one you wanted was
 * somewhere in a long scroll.
 *
 * It is now a shell: header, progress strip, and exactly ONE section at a time,
 * chosen from the application's own navigation. The sections themselves are
 * mostly the same components as before — `JourneyTimeline`,
 * `DocumentChecklistCard` and `StepDetailSheet` are untouched — moved into
 * `modules/applications/detail/tabs/` and given the full width they never had.
 *
 * ## Data
 *
 * Every query and mutation is the one that was here before. Two were added, and
 * only because the UI they serve had no way to reach them: `useUpdateApplication`
 * (the edit dialog and advisor assignment, both of which write existing fields
 * through `PATCH /applications/{id}`) and `useUser` for the applicant's contact
 * details, which the Communication action needs and which no longer has to be
 * read off the page.
 *
 * Queries are NOT conditional on the active tab. React Query caches them, the
 * workflow and history feed the Overview cards as well as their own tabs, and
 * gating them on the tab would make every tab switch a loading state for data
 * we already hold.
 *
 * ## Tab state
 *
 * `?tab=` in the URL rather than component state: refresh keeps your place, the
 * back button works between sections, and a counsellor can paste a colleague a
 * link straight to the documents. `replace` on navigation so six tab clicks do
 * not leave six entries to back through — but the first one pushes, so back
 * from a tab returns to the list.
 */
export function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.user?.role);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);

  const tabParam = searchParams.get("tab");
  const tab: ApplicationTab = isApplicationTab(tabParam) ? tabParam : "overview";

  const { data: application, isLoading } = useApplication(applicationId);
  const { data: history, isLoading: historyLoading } = useApplicationStatusHistory(applicationId);
  const { data: program } = useProgram(application?.program_id);
  const { data: university } = useUniversity(program?.university_id);
  const { data: workflow, isLoading: workflowLoading } = useApplicationWorkflow(applicationId);

  // Contact details for the Communication action. Gated on the same permission
  // the rest of the console uses to resolve a student — roles that cannot read
  // a user record get disabled channels rather than a failed request.
  const { data: student } = useUser(canBrowseApplicants(role) ? application?.student_id : undefined);

  const changeStatus = useChangeApplicationStatus(applicationId ?? "");
  const recordMilestone = useRecordMilestone(applicationId ?? "");
  // The server's config. Which statuses need evidence is its answer, not a
  // list repeated here — see `services/status_requirements.py`.
  const { data: statusRequirements } = useStatusRequirements();
  const milestoneStatuses = (statusRequirements ?? []).map((item) => item.status);
  const milestoneRequirement = (statusRequirements ?? []).find(
    (item) => item.status === milestoneStatus,
  );
  const updateApplication = useUpdateApplication(applicationId ?? "");
  const deleteApplication = useDeleteApplication();
  const startWorkflow = useStartApplicationWorkflow(applicationId ?? "");
  const updateStep = useUpdateWorkflowStep(applicationId ?? "");

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  // Which milestone is being recorded, if any. Null closes the dialog.
  const [milestoneStatus, setMilestoneStatus] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    if (program) setLabel(program.name);
  }, [program, setLabel]);

  function goToTab(next: ApplicationTab) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    // Replace only once we are already on a tab, so the first move away from
    // Overview stays in history and "back" returns to the applications list.
    setSearchParams(params, { replace: Boolean(tabParam) });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!application) {
    return <EmptyState icon={FileText} title="Application not found" description="It may have been deleted." />;
  }

  const canManage = isManagerRole(role) || role === UserRole.COUNSELLOR;
  const canDelete = isManagerRole(role);
  const isStudent = role === UserRole.STUDENT;
  /**
   * `GET /applications/{id}/status-history` orders ASCENDING — oldest first
   * (`application_service.list_status_history`) — and the Status History tab
   * wants the newest first. Reversing a COPY: `history` is React Query's cached
   * array and reversing it in place would corrupt the cache.
   */
  const recentHistory = history ? [...history].reverse() : undefined;
  const selectedStep = workflow?.steps.find((s) => s.id === selectedStepId) ?? null;

  const applicationRef = applicationReference(application);

  return (
    <div className="mx-auto max-w-[1560px]">
      <ApplicationHeader
        programName={program?.name ?? "Application"}
        universityName={university?.name ?? null}
        applicantName={<StudentNameCell userId={application.student_id} />}
        applicantInitials={
          student ? `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase() || null : null
        }
        applicantAvatarUrl={student?.avatar_url ?? null}
        applicationRef={applicationRef}
        status={application.status}
        updatedAt={application.updated_at}
        canManage={canManage}
        canDelete={canDelete}
        onBack={() => navigate("/applications")}
        onEdit={() => setEditOpen(true)}
        onChangeStatus={() => setStatusOpen(true)}
        onAssignAdvisor={() => setAssignOpen(true)}
        onCopyRef={() => {
          navigator.clipboard?.writeText(applicationRef).then(
            () => toast.success("Application ID copied"),
            () => toast.error("Couldn't copy to the clipboard"),
          );
        }}
        onDelete={() => {
          if (confirm("Delete this application permanently? This cannot be undone.")) {
            deleteApplication.mutate(application.id, { onSuccess: () => navigate("/applications") });
          }
        }}
      />

      {/* Sections and content. Two tracks from `lg`, stacked below it — the
          journey went back to being a tab, so nothing competes for the width
          and the content column is as wide as the page allows. */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-6">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ApplicationSectionNav value={tab} onChange={goToTab} />
        </div>

        {/* Exactly one section. The others are not rendered at all. */}
        <div className="min-w-0">
          {tab === "overview" && (
            <ApplicationOverview
              application={application}
              programName={program?.name ?? null}
              universityName={university?.name ?? null}
              canManage={canManage}
              onEdit={() => setEditOpen(true)}
              onAssignAdvisor={() => setAssignOpen(true)}
              onRecordOffer={() => setMilestoneStatus(ApplicationStatus.OFFER_RECEIVED)}
              onRecordCas={() => setMilestoneStatus(ApplicationStatus.CAS_RECEIVED)}
            />
          )}

          {tab === "documents" && (
            <ApplicationDocuments applicationId={application.id} studentId={application.student_id} />
          )}

          {tab === "status" && <ApplicationStatusHistory history={recentHistory} isLoading={historyLoading} />}

          {tab === "notes" && (
            <ApplicationNotes
              remarks={application.remarks}
              workflow={workflow}
              canManage={canManage}
              isSaving={updateApplication.isPending}
              onSave={(remarks) => updateApplication.mutate({ remarks })}
            />
          )}

          {tab === "activity" && <ApplicationActivity applicationId={application.id} role={role} />}

          {tab === "journey" && (
            <ApplicationJourney
              workflow={workflow}
              isLoading={workflowLoading}
              status={application.status}
              canManage={canManage && !isStudent}
              isStarting={startWorkflow.isPending}
              isUpdating={updateStep.isPending}
              onStart={() => startWorkflow.mutate(undefined)}
              onSelectStep={(step) => setSelectedStepId(step.id)}
              onSetStepStatus={(stepId, status) => updateStep.mutate({ stepId, payload: { status } })}
            />
          )}

          {tab === "communication" && (
            <ApplicationCommunication
              applicationId={application.id}
              studentId={application.student_id}
              phone={student?.phone}
              email={student?.email}
              programName={program?.name ?? "this application"}
              studentName={<StudentNameCell userId={application.student_id} />}
              isLoading={!student && canBrowseApplicants(role)}
            />
          )}
        </div>
      </div>

      <StepDetailSheet
        applicationId={application.id}
        step={selectedStep}
        open={Boolean(selectedStepId)}
        onOpenChange={(open) => !open && setSelectedStepId(null)}
        readOnly={isStudent}
      />

      <EditApplicationDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        application={application}
        isSaving={updateApplication.isPending}
        onSave={(payload) => updateApplication.mutate(payload, { onSuccess: () => setEditOpen(false) })}
      />

      {/* Recording an offer is a milestone, not a date edit.

          `RecordOfferDialog` used to live here and saved only
          `offer_received_date` through the generic update endpoint — the letter
          was a separate upload with nothing tying it to the transition. It is
          gone; `RecordMilestoneDialog` does the whole thing in one request,
          and it renders itself from the server's requirements config so the
          form and the validator cannot drift. */}
      {milestoneStatus && milestoneRequirement && (
        <RecordMilestoneDialog
          open
          onOpenChange={(next) => !next && setMilestoneStatus(null)}
          status={milestoneStatus}
          requirement={milestoneRequirement}
          application={application}
          isSaving={recordMilestone.isPending}
          onSubmit={(payload) =>
            recordMilestone.mutate(payload, { onSuccess: () => setMilestoneStatus(null) })
          }
        />
      )}

      <ChangeStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        current={application.status}
        isSaving={changeStatus.isPending}
        milestoneStatuses={milestoneStatuses}
        onSubmit={(status, remarks) =>
          changeStatus.mutate({ status, remarks }, { onSuccess: () => setStatusOpen(false) })
        }
        onMilestone={(status) => {
          // Picked a status that needs evidence. Close this dialog and open
          // the one that can collect it, rather than sending a half-recorded
          // transition the backend would refuse anyway.
          setStatusOpen(false);
          setMilestoneStatus(status);
        }}
      />

      <AssignAdvisorDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        currentId={application.counsellor_id}
        isSaving={updateApplication.isPending}
        onAssign={(userId) =>
          updateApplication.mutate({ counsellor_id: userId }, { onSuccess: () => setAssignOpen(false) })
        }
      />
    </div>
  );
}

