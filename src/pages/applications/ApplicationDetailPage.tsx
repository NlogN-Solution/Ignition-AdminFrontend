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
  useAcceptApplicationRequest,
  useChangeApplicationStatus,
  useRecordMilestone,
  useStatusRequirements,
  useDeleteApplication,
  useUpdateApplication,
} from "@/modules/applications/hooks";
import { useProgram, useUniversity } from "@/modules/academic/hooks";
import { useUser } from "@/modules/users/hooks";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { useApplicationWorkflow } from "@/modules/application-workflow/hooks";
import { ApplicationHeader } from "@/modules/applications/detail/ApplicationHeader";
import { StudentProfilePanel } from "@/modules/profile/StudentProfilePanel";
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
 * and `DocumentChecklistCard` are untouched — moved into
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
  // Still read, but only for the Notes tab's workflow summary. Starting a
  // workflow and editing its steps left with the Journey tab that drove them.
  const { data: workflow } = useApplicationWorkflow(applicationId);

  // Contact details for the Communication action. Gated on the same permission
  // the rest of the console uses to resolve a student — roles that cannot read
  // a user record get disabled channels rather than a failed request.
  const { data: student } = useUser(canBrowseApplicants(role) ? application?.student_id : undefined);

  const changeStatus = useChangeApplicationStatus(applicationId ?? "");
  const acceptRequest = useAcceptApplicationRequest();
  const recordMilestone = useRecordMilestone(applicationId ?? "");
  // The server's config. Which statuses need evidence is its answer, not a
  // list repeated here — see `services/status_requirements.py`.
  const { data: statusRequirements } = useStatusRequirements();
  const requirements = statusRequirements ?? [];
  const updateApplication = useUpdateApplication(applicationId ?? "");
  const deleteApplication = useDeleteApplication();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  // Which milestone is being recorded, if any. Null closes the dialog.
  const [milestoneStatus, setMilestoneStatus] = useState<ApplicationStatus | null>(null);

  /**
   * Declared *after* `milestoneStatus`, which is not a style preference.
   *
   * This lookup used to sit up with the queries, above the `useState` that
   * defines the thing it reads — a temporal-dead-zone error waiting for a
   * non-empty array, because `[].find(cb)` never calls `cb`. And the array was
   * always empty: `GET /applications/status-requirements` was being swallowed
   * by `GET /applications/{application_id}` and 422ing, so the bug could not
   * fire. Fixing the route on the backend is what made this page crash with
   * "Cannot access 'milestoneStatus' before initialization", and TypeScript
   * cannot catch it because a `const` referenced inside a closure is legal
   * until it runs.
   */
  const milestoneRequirement = requirements.find((item) => item.status === milestoneStatus);

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
  /**
   * `GET /applications/{id}/status-history` orders ASCENDING — oldest first
   * (`application_service.list_status_history`) — and the Status History tab
   * wants the newest first. Reversing a COPY: `history` is React Query's cached
   * array and reversing it in place would corrupt the cache.
   */
  const recentHistory = history ? [...history].reverse() : undefined;

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
          and the content column is as wide as the page allows.

          The content comes first in the DOM *and* on the left, with the
          section nav on the right. The console already has a global sidebar
          hard against the left edge, and a second column of links twenty
          pixels from it read as one nested navigation rather than as the
          record and its sections. It also puts the snapshot — the thing the
          page is about — where the eye lands, and the nav is where a reader
          who wants to change section goes looking anyway.

          Stacking below `lg` puts the content first, which is the right order
          on a phone: on a narrow screen the nav is a horizontal strip that
          would otherwise push the record below the fold. */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-6">
        {/* Exactly one section. The others are not rendered at all. */}
        <div className="min-w-0">
          {tab === "overview" && (
            <ApplicationOverview
              application={application}
              programName={program?.name ?? null}
              universityName={university?.name ?? null}
              applicantPhone={student?.phone}
              canManage={canManage}
              requirements={requirements}
              onEdit={() => setEditOpen(true)}
              onAssignAdvisor={() => setAssignOpen(true)}
              onRecordMilestone={setMilestoneStatus}
              onAcceptRequest={() => acceptRequest.mutate(application.id)}
              isAccepting={acceptRequest.isPending}
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

          {/* The applicant's own record, in the same component the lead page
              and the profile slide-over render. Gated on the permission that
              governs reading a student anywhere else in the console — a role
              that cannot resolve a user gets the explanation rather than a
              panel of failed requests. */}
          {tab === "profile" &&
            (canBrowseApplicants(role) ? (
              <StudentProfilePanel userId={application.student_id} />
            ) : (
              <EmptyState
                icon={FileText}
                title="You cannot view applicant profiles"
                description="Ask an administrator if you need access to this applicant's details."
              />
            ))}

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

        {/* Second in the DOM as well as on the right: the record is what the
            page is for, and a screen reader or a phone should reach it before
            the list of ways to leave it. `order-first` on small screens is
            deliberately NOT set — see the note on the grid above. */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ApplicationSectionNav value={tab} onChange={goToTab} />
        </div>
      </div>

      <EditApplicationDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        application={application}
        isSaving={updateApplication.isPending}
        onSave={(payload) => updateApplication.mutate(payload, { onSuccess: () => setEditOpen(false) })}
      />

      {/* The correction path, opened from the Evidence card on Overview.

          Recording an offer normally happens in the status dialog above, which
          is where a counsellor already is when the letter arrives. This is for
          fixing a date that was typed wrong or replacing a file — and for the
          case where the status was moved before the letter turned up. Both
          render the same fields from the server's requirements config, so the
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

      {/* One dialog for both paths. Picking a status that needs evidence
          unfolds the date and the letter inside it and switches the button to
          the milestone endpoint, rather than closing and handing over to a
          second dialog that asked the question this one had just warned
          about. */}
      <ChangeStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        application={application}
        isSaving={changeStatus.isPending || recordMilestone.isPending}
        requirements={requirements}
        onSubmit={(status, remarks) =>
          changeStatus.mutate({ status, remarks }, { onSuccess: () => setStatusOpen(false) })
        }
        onRecordMilestone={(payload) =>
          recordMilestone.mutate(payload, { onSuccess: () => setStatusOpen(false) })
        }
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

