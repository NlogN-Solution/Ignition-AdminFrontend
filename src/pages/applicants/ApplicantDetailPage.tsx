import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckSquare,
  Edit3,
  FileText,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  UserSquare2,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { API_BASE_URL } from "@/services/apiClient";
import { useStudentProfile, useUser } from "@/modules/users/hooks";
import { EnablePortalDialog } from "@/modules/users/EnablePortalDialog";
import { FullProfileSheet } from "@/modules/profile/FullProfileSheet";
import { useApplications } from "@/modules/applications/hooks";
import { useDocuments } from "@/modules/documents/hooks";
import { usePayments } from "@/modules/payments/hooks";
import { useAppointments } from "@/modules/appointments/hooks";
import { useTasks } from "@/modules/tasks/hooks";
import { ApplicationFormDialog } from "@/modules/applications/ApplicationFormDialog";
import { DocumentUploadDialog } from "@/modules/documents/DocumentUploadDialog";
import { PaymentFormDialog } from "@/modules/payments/PaymentFormDialog";
import { AppointmentFormDialog } from "@/modules/appointments/AppointmentFormDialog";
import { ProgramNameCell } from "@/modules/academic/ProgramNameCell";
import { WorkflowProgressChip } from "@/modules/application-workflow/WorkflowProgressChip";
import { formatCurrency, formatDate, formatDateTime, initials, toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";

type QuickDialog = "application" | "document" | "payment" | "appointment" | null;

export function ApplicantDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);
  const [fullProfileOpen, setFullProfileOpen] = useState(false);
  const [quickDialog, setQuickDialog] = useState<QuickDialog>(null);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: profile, isLoading: profileLoading } = useStudentProfile(userId);
  const canSeeSensitive = isManagerRole(role);

  const { data: applications } = useApplications({ student_id: userId, limit: 5 });
  const { data: documents } = useDocuments({ student_id: userId, limit: 5 });
  const { data: payments } = usePayments({ student_id: userId, limit: 5 });
  const { data: appointments } = useAppointments({ student_id: userId, limit: 5 });
  const { data: tasks } = useTasks({ student_id: userId, limit: 5 });

  useEffect(() => {
    if (user) setLabel(`${user.first_name} ${user.last_name}`);
  }, [user, setLabel]);

  if (userLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <EmptyState icon={GraduationCap} title="Applicant not found" description="They may have been removed." />;
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/applicants")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applicants
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3.5">
          <Avatar className="h-14 w-14 border border-border">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url.startsWith("http") ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`} alt="" />
            )}
            <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">{initials(user.first_name, user.last_name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
                {user.first_name} {user.last_name}
              </h1>
              <StatusBadge status={user.status} />
              {user.has_portal_access && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                  <KeyRound className="h-3 w-3" /> Portal active
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </span>
              )}
              {profile?.preferred_country && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.preferred_country}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFullProfileOpen(true)}>
            <UserSquare2 className="h-3.5 w-3.5" /> View full profile
          </Button>
          {!user.has_portal_access && (
            <Button variant="outline" size="sm" onClick={() => setPortalDialogOpen(true)}>
              <KeyRound className="h-3.5 w-3.5" /> Enable portal
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setQuickDialog("appointment")}>
            <CalendarDays className="h-3.5 w-3.5" /> Book
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDialog("document")}>
            <FileText className="h-3.5 w-3.5" /> Upload
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDialog("payment")}>
            <Wallet className="h-3.5 w-3.5" /> Payment
          </Button>
          <Button size="sm" onClick={() => setQuickDialog("application")}>
            <Plus className="h-3.5 w-3.5" /> New application
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">Applicant profile</h2>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFullProfileOpen(true)}>
                <Edit3 className="h-3 w-3" /> Edit
              </Button>
            </div>
            {profileLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !profile ? (
              <EmptyState
                icon={GraduationCap}
                title="No profile details yet"
                description="Add nationality, education background, and preferences."
                action={
                  <Button size="sm" onClick={() => setFullProfileOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add details
                  </Button>
                }
                className="border-none py-8"
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Field label="Nationality" value={profile.nationality} />
                <Field label="Education level" value={toTitleCase(profile.education_level)} />
                <Field label="Passport no." value={profile.passport_number} />
                <Field label="Preferred country" value={profile.preferred_country} />
                <Field label="Preferred program" value={profile.preferred_program} />
                <Field label="Preferred intake" value={profile.preferred_intake} />
                <Field label="Budget" value={profile.budget ? formatCurrency(profile.budget) : undefined} />
                <Field label="GPA" value={profile.gpa ? String(profile.gpa) : undefined} />
              </div>
            )}
            {profile?.notes && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-foreground">{profile.notes}</p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">Applications</h2>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setQuickDialog("application")}>
                <Plus className="h-3 w-3" /> New
              </Button>
            </div>
            {!applications || applications.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {applications.items.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="flex w-full items-center justify-between py-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <ProgramNameCell programId={app.program_id} />
                    </div>
                    <div className="flex items-center gap-2">
                      <WorkflowProgressChip applicationId={app.id} />
                      <StatusBadge status={app.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {canSeeSensitive && (
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">Documents</h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setQuickDialog("document")}>
                  <Plus className="h-3 w-3" /> Upload
                </Button>
              </div>
              {!documents || documents.items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="divide-y divide-border">
                  {documents.items.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{doc.title ?? doc.original_file_name}</span>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">Upcoming appointments</h2>
            {!appointments || appointments.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {appointments.items.map((appt) => (
                  <div key={appt.id} className="rounded-lg border border-border p-2.5">
                    <p className="text-[13px] font-medium text-foreground">{appt.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(appt.start_time)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {canSeeSensitive && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-[13px] font-semibold text-foreground">Payments</h2>
              {!payments || payments.items.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <div className="space-y-2">
                  {payments.items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm tabular-nums text-foreground">{formatCurrency(p.amount, p.currency)}</span>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">Tasks</h2>
            {!tasks || tasks.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              <div className="space-y-2">
                {tasks.items.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <CheckSquare className={cn("h-3.5 w-3.5", t.status === "completed" ? "text-success" : "text-muted-foreground")} />
                    <span className="flex-1 truncate text-sm text-foreground">{t.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(t.due_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <FullProfileSheet
        userId={user.id}
        name={`${user.first_name} ${user.last_name}`}
        open={fullProfileOpen}
        onOpenChange={setFullProfileOpen}
      />
      <ApplicationFormDialog open={quickDialog === "application"} onOpenChange={(o) => setQuickDialog(o ? "application" : null)} defaultStudentId={user.id} />
      <DocumentUploadDialog open={quickDialog === "document"} onOpenChange={(o) => setQuickDialog(o ? "document" : null)} defaultStudentId={user.id} />
      <PaymentFormDialog open={quickDialog === "payment"} onOpenChange={(o) => setQuickDialog(o ? "payment" : null)} defaultStudentId={user.id} />
      <AppointmentFormDialog open={quickDialog === "appointment"} onOpenChange={(o) => setQuickDialog(o ? "appointment" : null)} defaultStudentId={user.id} />
      <EnablePortalDialog user={user} open={portalDialogOpen} onOpenChange={setPortalDialogOpen} />
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-foreground">{value ?? "—"}</p>
    </div>
  );
}
