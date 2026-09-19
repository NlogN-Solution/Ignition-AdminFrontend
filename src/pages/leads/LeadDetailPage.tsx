import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRightCircle,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock,
  FilePlus2,
  FileText,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Tag,
  Trash2,
  UserCog,
  UserSquare2,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentProfilePanel } from "@/modules/profile/StudentProfilePanel";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPicker } from "@/components/shared/UserPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useAuthStore } from "@/services/authStore";
import { canAccessModule, canBrowseApplicants, isManagerRole } from "@/constants/permissions";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { useUser } from "@/modules/users/hooks";
import {
  useAssignLead,
  useChangeLeadStatus,
  useDeleteLead,
  forgetLead,
  useLead,
  useLeadActivities,
  useLeadFollowUps,
  useQualifyLead,
  useUpdateLead,
} from "@/modules/leads/hooks";
import { ConvertLeadDialog } from "@/modules/leads/ConvertLeadDialog";
import { LeadFormDialog } from "@/modules/leads/LeadFormDialog";
import { LostLeadDialog } from "@/modules/leads/LostLeadDialog";
import { LeadFollowUpTimeline } from "@/modules/leads/LeadFollowUpTimeline";
import { LifecycleRail } from "@/components/shared/LifecycleRail";
import { LIFECYCLE_STEPS, STEP_LABELS, lifecycleOf } from "@/modules/leads/lifecycle";
import { LeadClientSummaryCard } from "@/modules/leads/LeadClientSummaryCard";
import { PriorityTasksCard } from "@/modules/priority-tasks/PriorityTasksCard";
import { LeadApplicationsTab } from "@/modules/leads/LeadApplicationsTab";
import { ThreadPanel } from "@/modules/communication/ThreadPanel";
import { useLeadThreads } from "@/modules/communication/hooks";
import { PriorityBadge } from "@/modules/leads/PriorityBadge";
import { stageOf, type LeadStage } from "@/modules/leads/types";
import { ApplicationFormDialog } from "@/modules/applications/ApplicationFormDialog";
import { DocumentUploadDialog } from "@/modules/documents/DocumentUploadDialog";
import { PaymentFormDialog } from "@/modules/payments/PaymentFormDialog";
import { AppointmentFormDialog } from "@/modules/appointments/AppointmentFormDialog";
import { LeadStatus, UserRole } from "@/types/enums";
import { formatDate, formatDateTime, formatRelativeTime, toTitleCase } from "@/utils/format";

/**
 * Three tabs, always. The stage decides which three — a raw lead has no
 * applications and a client is past scheduling qualification calls — so the page
 * never grows a row of tabs that are empty for the person in front of you.
 */
// Communication is on *every* stage, which is the point rather than an
// oversight: the whole reason threads resolve by person is that a conversation
// does not restart when somebody's stage label changes. A tab that appeared at
// conversion would be telling the counsellor the history began there.
const TABS_BY_STAGE: Record<LeadStage, { value: string; label: string }[]> = {
  raw: [
    { value: "overview", label: "Overview" },
    { value: "communication", label: "Communication" },
    { value: "follow-ups", label: "Follow-ups" },
    { value: "activity", label: "Activity" },
  ],
  prospect: [
    { value: "overview", label: "Overview" },
    { value: "communication", label: "Communication" },
    { value: "follow-ups", label: "Follow-ups" },
    { value: "activity", label: "Activity" },
  ],
  // Profile is client-only, and not as a policy — a raw lead has no user
  // account behind it (`converted_user_id` is null until conversion), so there
  // is no education, work history or passport to show. Offering the tab and
  // then explaining it is empty would be worse than not offering it.
  client: [
    { value: "overview", label: "Overview" },
    { value: "profile", label: "Profile" },
    { value: "communication", label: "Communication" },
    { value: "applications", label: "Applications" },
    { value: "activity", label: "Activity" },
  ],
  lost: [
    { value: "overview", label: "Overview" },
    { value: "communication", label: "Communication" },
    { value: "activity", label: "Activity" },
  ],
};

type QuickDialog = "document" | "payment" | "appointment" | null;

export function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);

  const queryClient = useQueryClient();
  const { data: lead, isLoading, error, refetch } = useLead(leadId);
  const changeStatus = useChangeLeadStatus(leadId ?? "");
  const qualifyLead = useQualifyLead(leadId ?? "");
  const assignLead = useAssignLead(leadId ?? "");
  const deleteLead = useDeleteLead();

  // Set when this page deletes its own lead. The lead's cached queries are
  // cleared on unmount rather than in the mutation, because clearing them while
  // this page is still mounted makes its observers re-create and re-fetch them —
  // a 404 for each.
  const deletedLeadId = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (deletedLeadId.current) forgetLead(queryClient, deletedLeadId.current);
    },
    [queryClient],
  );

  // A lead that no longer exists — deleted here, deleted by someone else, or
  // reached through Back or a stale link — sends you to the list instead of
  // rendering a "not found" page.
  const isGone = isAxiosError(error) && error.response?.status === 404;
  useEffect(() => {
    if (!isGone) return;
    toast.info("That lead no longer exists.");
    navigate("/leads", { replace: true });
  }, [isGone, navigate]);

  const [tab, setTab] = useState("overview");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState<string | undefined>();
  const [convertOpen, setConvertOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fullProfileOpen, setFullProfileOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [quickDialog, setQuickDialog] = useState<QuickDialog>(null);
  const [applicationOpen, setApplicationOpen] = useQueryFlagDialog("startApplication");
  /** Set when the application dialog is opened from a shortlisted university. */
  const [applicationUniversityId, setApplicationUniversityId] = useState<string | undefined>();
  // Set only from the portal shortlist, where the student picked the course
  // themselves. The research shortlist leaves it undefined on purpose.
  const [applicationProgramId, setApplicationProgramId] = useState<string | undefined>();

  const stage = lead ? stageOf(lead.status) : "raw";
  const clientUserId = stage === "client" ? (lead?.converted_user_id ?? undefined) : undefined;
  // Deduplicated with the summary card's own query by React Query — the header needs
  // `has_portal_access` to decide whether "Enable portal" belongs in the menu.
  const { data: clientUser } = useUser(canBrowseApplicants(role) ? clientUserId : undefined);

  useEffect(() => {
    if (lead) setLabel(`${lead.first_name} ${lead.last_name ?? ""}`.trim());
  }, [lead, setLabel]);

  if (isLoading || isGone) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <EmptyState
        icon={UserCog}
        title="Couldn't load this lead"
        description="Check your connection and try again."
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/leads")}>
              Back to leads
            </Button>
            <Button size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        }
      />
    );
  }

  const canManage = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.COUNSELLOR;
  const isManager = isManagerRole(role);
  const tabs = TABS_BY_STAGE[stage];
  // Converting removes the Follow-ups trigger from under Radix. Without this the
  // panel would go blank on exactly the action this page exists for.
  const activeTab = tabs.some((t) => t.value === tab) ? tab : "overview";

  const canStartApplication = Boolean(clientUserId) && canAccessModule(role, "applications");
  const leadCycle = lifecycleOf(lead);

  function openApplication(universityId?: string, programId?: string) {
    setApplicationUniversityId(universityId);
    setApplicationProgramId(programId);
    setApplicationOpen(true);
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/leads")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-foreground">
              {lead.first_name} {lead.last_name ?? ""}
            </h1>
            {stage !== "client" && <PriorityBadge priority={lead.priority} />}
            {clientUser?.has_portal_access && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <KeyRound className="h-3 w-3" /> Portal active
              </span>
            )}
          </div>

          {/* The same rail the list draws, so the record reads as the row you
              clicked rather than as a different vocabulary for the same person.
              `enrolled` is real here: this page already loads the applications. */}
          <LifecycleRail
            className="mt-3 max-w-[420px]"
            steps={LIFECYCLE_STEPS.map((s) => STEP_LABELS[s])}
            index={leadCycle.index}
            ended={leadCycle.lost}
            caption={leadCycle.statusLabel}
            note={`Captured ${formatDateTime(lead.created_at)}`}
          />
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {/* One forward action at a time — the stage decides which. */}
            {stage === "raw" && (
              <Button size="sm" onClick={() => qualifyLead.mutate(undefined)} disabled={qualifyLead.isPending}>
                {qualifyLead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Qualify
              </Button>
            )}

            {stage === "prospect" && (
              <Button size="sm" onClick={() => setConvertOpen(true)}>
                <ArrowRightCircle className="h-3.5 w-3.5" /> Convert to client
              </Button>
            )}

            {stage === "client" && canAccessModule(role, "applications") && (
              <Button
                size="sm"
                disabled={!canStartApplication}
                title={canStartApplication ? undefined : "This client has no student account yet"}
                onClick={() => openApplication()}
              >
                <FilePlus2 className="h-3.5 w-3.5" /> Start application
              </Button>
            )}

            {stage === "lost" && (
              <Button
                size="sm"
                variant="outline"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate({ status: LeadStatus.CONTACTED })}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reopen
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit details
                </DropdownMenuItem>

                {stage !== "client" && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRightCircle className="h-3.5 w-3.5" /> Change status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {[LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.FOLLOW_UP].map((s) => (
                        <DropdownMenuItem key={s} disabled={s === lead.status} onSelect={() => changeStatus.mutate({ status: s })}>
                          {toTitleCase(s)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {isManager && (
                  <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
                    <UserCog className="h-3.5 w-3.5" /> Assign owner
                  </DropdownMenuItem>
                )}

                {stage === "client" && clientUserId && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Client</DropdownMenuLabel>
                    {canBrowseApplicants(role) && (
                      <DropdownMenuItem onSelect={() => setFullProfileOpen(true)}>
                        <UserSquare2 className="h-3.5 w-3.5" /> View full profile
                      </DropdownMenuItem>
                    )}
                    {clientUser && !clientUser.has_portal_access && (
                      <DropdownMenuItem onSelect={() => setPortalOpen(true)}>
                        <KeyRound className="h-3.5 w-3.5" /> Enable portal
                      </DropdownMenuItem>
                    )}
                    {canAccessModule(role, "appointments") && (
                      <DropdownMenuItem onSelect={() => setQuickDialog("appointment")}>
                        <CalendarDays className="h-3.5 w-3.5" /> Book appointment
                      </DropdownMenuItem>
                    )}
                    {canAccessModule(role, "documents") && (
                      <>
                        <DropdownMenuItem onSelect={() => setQuickDialog("document")}>
                          <FileText className="h-3.5 w-3.5" /> Upload document
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate(`/documents/${clientUserId}`)}>
                          <FileText className="h-3.5 w-3.5" /> All documents
                        </DropdownMenuItem>
                      </>
                    )}
                    {canAccessModule(role, "payments") && (
                      <DropdownMenuItem onSelect={() => setQuickDialog("payment")}>
                        <Wallet className="h-3.5 w-3.5" /> Record payment
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {stage !== "client" && stage !== "lost" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-danger focus:text-danger" onSelect={() => setLostOpen(true)}>
                      <XCircle className="h-3.5 w-3.5" /> Mark lost
                    </DropdownMenuItem>
                  </>
                )}

                {isManager && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-danger focus:text-danger"
                      onSelect={() => {
                        if (confirm("Delete this lead permanently?")) {
                          deleteLead.mutate(lead.id, {
                            onSuccess: () => {
                              deletedLeadId.current = lead.id;
                              // `replace`: Back must not return to a lead that is gone.
                              navigate("/leads", { replace: true });
                            },
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete lead
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 text-[13px] font-semibold text-foreground">Contact</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoRow icon={Phone} label="Phone" value={lead.phone} />
                  <InfoRow icon={Mail} label="Email" value={lead.email ?? "—"} />
                  <InfoRow icon={BookOpen} label="Interested course" value={lead.interested_course ?? "—"} />
                  <InfoRow icon={CalendarClock} label="Preferred intake" value={lead.preferred_intake ?? "—"} />
                  <InfoRow icon={Globe} label="Source" value={toTitleCase(lead.source)} />
                </div>

                {lead.tags && lead.tags.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Tag className="h-3 w-3" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {stage === "prospect" && !lead.email && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-[13px] text-foreground">
                  <span className="font-medium">Ready to convert?</span> This lead has no email address, so converting
                  will create their student account under a placeholder one. Add a real address first if you have it.
                </div>
              )}

              {stage === "client" && clientUser && canBrowseApplicants(role) && (
                <LeadClientSummaryCard
                  user={clientUser}
                  fullProfileOpen={fullProfileOpen}
                  onFullProfileOpenChange={setFullProfileOpen}
                  portalOpen={portalOpen}
                  onPortalOpenChange={setPortalOpen}
                  onStartApplication={openApplication}
                />
              )}

              {stage === "client" && !clientUserId && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-[13px] text-foreground">
                  This lead is marked converted but has no student account linked, so applications can't be started from
                  here. Converting again from a lead with an email address will create one.
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* What the student should do next — leads their dashboard's
                  "Priority tasks". Clients only: a lead has no portal yet. */}
              {stage === "client" && clientUserId && canManage && <PriorityTasksCard studentId={clientUserId} />}

              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 text-[13px] font-semibold text-foreground">Ownership & lifecycle</h2>
                <div className="space-y-3 text-sm">
                  <InfoRow icon={UserCog} label="Owner" value={lead.assigned_to ? <StaffNameCell userId={lead.assigned_to} /> : "Unassigned"} />
                  {lead.qualified_at && (
                    <InfoRow
                      icon={ShieldCheck}
                      label="Qualified"
                      value={
                        <>
                          {formatDate(lead.qualified_at)} by <StaffNameCell userId={lead.qualified_by} />
                        </>
                      }
                    />
                  )}
                  {/* Gated on the stage, not on the timestamp: reopening a lost lead
                      leaves lost_at and lost_reason populated. */}
                  {stage === "client" && lead.converted_at && (
                    <InfoRow
                      icon={ArrowRightCircle}
                      label="Converted"
                      value={
                        <>
                          {formatDate(lead.converted_at)}
                          {lead.conversion_source && ` · ${toTitleCase(lead.conversion_source)}`}
                        </>
                      }
                    />
                  )}
                  {stage === "lost" && lead.lost_at && (
                    <InfoRow icon={XCircle} label="Lost" value={<>{formatDate(lead.lost_at)}{lead.lost_reason && ` · ${toTitleCase(lead.lost_reason)}`}</>} />
                  )}
                </div>
              </div>

              <NotesCard leadId={lead.id} initialNotes={lead.remarks} />
            </div>
          </div>
        </TabsContent>

        {tabs.some((t) => t.value === "follow-ups") && (
          <TabsContent value="follow-ups" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <FollowUpMethodChips leadId={lead.id} />
              <LeadFollowUpTimeline leadId={lead.id} leadStatus={lead.status} />
            </div>
          </TabsContent>
        )}

        {tabs.some((t) => t.value === "profile") && (
          <TabsContent value="profile" className="mt-4">
            {clientUserId && canBrowseApplicants(role) ? (
              <StudentProfilePanel userId={clientUserId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                This lead has no portal account yet, so there is no profile to show.
              </p>
            )}
          </TabsContent>
        )}

        {tabs.some((t) => t.value === "applications") && clientUserId && canAccessModule(role, "applications") && (
          <TabsContent value="applications" className="mt-4">
            <LeadApplicationsTab studentId={clientUserId} onStartApplication={() => openApplication()} />
          </TabsContent>
        )}

        <TabsContent value="communication" className="mt-4">
          {/* Keyed by the *lead*, which resolves to the same threads the
              student page shows once they have converted — the backend joins
              through `leads.converted_user_id`. One store, two doors. */}
          <LeadCommunicationTab leadId={lead.id} studentId={clientUserId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityTab leadId={lead.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Counsellor</Label>
            <UserPicker value={assignee} onChange={setAssignee} role={UserRole.COUNSELLOR} placeholder="Select counsellor…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!assignee || assignLead.isPending}
              onClick={() => assignee && assignLead.mutate(assignee, { onSuccess: () => setAssignOpen(false) })}
            >
              {assignLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConvertLeadDialog
        leadId={lead.id}
        leadName={`${lead.first_name} ${lead.last_name ?? ""}`.trim()}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        onStartApplication={() => {
          setConvertOpen(false);
          setTab("overview");
          openApplication();
        }}
      />
      <LostLeadDialog leadId={lead.id} open={lostOpen} onOpenChange={setLostOpen} />
      <LeadFormDialog lead={lead} open={editOpen} onOpenChange={setEditOpen} />

      {clientUserId && (
        <>
          <ApplicationFormDialog
            open={applicationOpen}
            onOpenChange={(o) => {
              setApplicationOpen(o);
              if (!o) {
                setApplicationUniversityId(undefined);
                setApplicationProgramId(undefined);
              }
            }}
            defaultStudentId={clientUserId}
            defaultUniversityId={applicationUniversityId}
            defaultProgramId={applicationProgramId}
          />
          <DocumentUploadDialog
            open={quickDialog === "document"}
            onOpenChange={(o) => setQuickDialog(o ? "document" : null)}
            defaultStudentId={clientUserId}
          />
          <PaymentFormDialog
            open={quickDialog === "payment"}
            onOpenChange={(o) => setQuickDialog(o ? "payment" : null)}
            defaultStudentId={clientUserId}
          />
          <AppointmentFormDialog
            open={quickDialog === "appointment"}
            onOpenChange={(o) => setQuickDialog(o ? "appointment" : null)}
            defaultStudentId={clientUserId}
          />
        </>
      )}
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

/** Was its own tab. It is two fields and a button — it belongs in the rail. */
function NotesCard({ leadId, initialNotes }: { leadId: string; initialNotes: string | null }) {
  const updateLead = useUpdateLead(leadId);
  const [notes, setNotes] = useState(initialNotes ?? "");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Internal notes</h2>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Only visible to your team…" />
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={notes === (initialNotes ?? "") || updateLead.isPending} onClick={() => updateLead.mutate({ remarks: notes })}>
          {updateLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save notes
        </Button>
      </div>
    </div>
  );
}

/**
 * The activity query lives here rather than on the page, so opening a lead costs one
 * request instead of two — Radix unmounts inactive tabs, so it only runs when read.
 */
/**
 * The lead's correspondence.
 *
 * `studentId` is passed so a *new* thread opened after conversion is written
 * against the account rather than only the lead — the person has one now, and
 * writing it against the lead would slowly re-create the split this feature
 * removed. Reading is unaffected either way: `threads_for_lead` returns both.
 */
function LeadCommunicationTab({
  leadId,
  studentId,
}: {
  leadId: string;
  studentId: string | undefined;
}) {
  const { data: threads, isLoading } = useLeadThreads(leadId);
  return (
    <ThreadPanel
      threads={threads}
      isLoading={isLoading}
      target={studentId ? { studentId, leadId } : { leadId }}
      emptyDescription="Nothing yet. Open a thread and it stays with this person for the whole journey — through conversion, into their portal, and onto every application."
    />
  );
}

function ActivityTab({ leadId }: { leadId: string }) {
  const { data: activities, isLoading } = useLeadActivities(leadId);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-4">
          {activities.map((activity, idx) => (
            <li key={activity.id} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-2.5 w-2.5" />
                </span>
                {idx < activities.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-[13px] font-medium text-foreground">{activity.title ?? toTitleCase(activity.activity_type)}</p>
                {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(activity.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * All the Communication tab actually told you: which channels this person has been
 * reached on, and how often. It was a whole tab re-grouping the follow-ups already
 * shown below it; here it is a row of chips over the same cached query.
 */
function FollowUpMethodChips({ leadId }: { leadId: string }) {
  const { data } = useLeadFollowUps(leadId);

  const counts = useMemo(() => {
    const byMethod = new Map<string, number>();
    for (const item of data?.items ?? []) {
      if (!item.completed_at) continue;
      byMethod.set(item.method, (byMethod.get(item.method) ?? 0) + 1);
    }
    return Array.from(byMethod.entries());
  }, [data]);

  if (counts.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border pb-3">
      {counts.map(([method, count]) => (
        <span key={method} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {toTitleCase(method)} <span className="font-medium text-foreground tabular-nums">{count}</span>
        </span>
      ))}
    </div>
  );
}
