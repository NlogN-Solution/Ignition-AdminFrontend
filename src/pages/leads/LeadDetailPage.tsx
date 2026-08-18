import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Globe,
  BookOpen,
  CalendarClock,
  UserCog,
  ShieldCheck,
  ArrowRightCircle,
  XCircle,
  Trash2,
  Clock,
  Tag,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPicker } from "@/components/shared/UserPicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import {
  useAssignLead,
  useChangeLeadStatus,
  useDeleteLead,
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
import { PriorityBadge } from "@/modules/leads/PriorityBadge";
import type { LeadFollowUpRead } from "@/modules/leads/types";
import { LeadStatus, UserRole } from "@/types/enums";
import { formatDate, formatDateTime, formatRelativeTime, toTitleCase } from "@/utils/format";

export function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const setLabel = useBreadcrumbStore((s) => s.setLabel);

  const { data: lead, isLoading } = useLead(leadId);
  const { data: activities, isLoading: activitiesLoading } = useLeadActivities(leadId);
  const changeStatus = useChangeLeadStatus(leadId ?? "");
  const qualifyLead = useQualifyLead(leadId ?? "");
  const assignLead = useAssignLead(leadId ?? "");
  const deleteLead = useDeleteLead();

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState<string | undefined>();
  const [convertOpen, setConvertOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (lead) setLabel(`${lead.first_name} ${lead.last_name ?? ""}`.trim());
  }, [lead, setLabel]);

  if (isLoading) {
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
    return <EmptyState icon={UserCog} title="Lead not found" description="It may have been deleted." />;
  }

  const canManage = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.COUNSELLOR;
  const isRaw = lead.status === LeadStatus.NEW || lead.status === LeadStatus.CONTACTED || lead.status === LeadStatus.FOLLOW_UP;
  const isTerminal = lead.status === LeadStatus.CONVERTED || lead.status === LeadStatus.LOST;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/leads")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
              {lead.first_name} {lead.last_name ?? ""}
            </h1>
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Lead • Created {formatDateTime(lead.created_at)}</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Change status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.FOLLOW_UP].map((s) => (
                  <DropdownMenuItem key={s} disabled={s === lead.status} onSelect={() => changeStatus.mutate({ status: s })}>
                    {toTitleCase(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isManagerRole(role) && (
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                <UserCog className="h-3.5 w-3.5" /> Assign
              </Button>
            )}

            {isRaw && (
              <Button variant="outline" size="sm" onClick={() => qualifyLead.mutate(undefined)} disabled={qualifyLead.isPending}>
                <ShieldCheck className="h-3.5 w-3.5" /> Qualify
              </Button>
            )}

            {!isTerminal && (
              <Button size="sm" onClick={() => setConvertOpen(true)}>
                <ArrowRightCircle className="h-3.5 w-3.5" /> Convert
              </Button>
            )}

            {!isTerminal && (
              <Button variant="outline" size="sm" className="text-danger hover:text-danger" onClick={() => setLostOpen(true)}>
                <XCircle className="h-3.5 w-3.5" /> Mark lost
              </Button>
            )}

            {isManagerRole(role) && (
              <Button
                variant="outline"
                size="icon"
                className="text-danger hover:text-danger"
                onClick={() => {
                  if (confirm("Delete this lead permanently?")) {
                    deleteLead.mutate(lead.id, { onSuccess: () => navigate("/leads") });
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-Ups</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
              <h2 className="mb-3 text-[13px] font-semibold text-foreground">Contact</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon={Phone} label="Phone" value={lead.phone} />
                <InfoRow icon={Mail} label="Email" value={lead.email ?? "—"} />
                <InfoRow icon={Globe} label="Interested country" value={lead.interested_country ?? "—"} />
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

            <div className="space-y-4">
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
                  {lead.converted_at && (
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
                  {lead.lost_at && (
                    <InfoRow icon={XCircle} label="Lost" value={<>{formatDate(lead.lost_at)}{lead.lost_reason && ` · ${toTitleCase(lead.lost_reason)}`}</>} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            {activitiesLoading ? (
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
        </TabsContent>

        <TabsContent value="follow-ups" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <LeadFollowUpTimeline leadId={lead.id} leadStatus={lead.status} />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesTab leadId={lead.id} initialNotes={lead.remarks} />
        </TabsContent>

        <TabsContent value="communication" className="mt-4">
          <CommunicationTab leadId={lead.id} />
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
      />
      <LostLeadDialog leadId={lead.id} open={lostOpen} onOpenChange={setLostOpen} />
      <LeadFormDialog lead={lead} open={editOpen} onOpenChange={setEditOpen} />
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

function NotesTab({ leadId, initialNotes }: { leadId: string; initialNotes: string | null }) {
  const updateLead = useUpdateLead(leadId);
  const [notes, setNotes] = useState(initialNotes ?? "");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Internal notes</h2>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Only visible to your team…" />
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={notes === (initialNotes ?? "") || updateLead.isPending} onClick={() => updateLead.mutate({ remarks: notes })}>
          {updateLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save notes
        </Button>
      </div>
    </div>
  );
}

function CommunicationTab({ leadId }: { leadId: string }) {
  const { data, isLoading } = useLeadFollowUps(leadId);

  const grouped = useMemo(() => {
    const byMethod = new Map<string, LeadFollowUpRead[]>();
    for (const item of data?.items ?? []) {
      if (!byMethod.has(item.method)) byMethod.set(item.method, []);
      byMethod.get(item.method)!.push(item);
    }
    return byMethod;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No communication history yet"
        description="Calls, WhatsApp messages, emails, and meetings logged via follow-ups will appear here, grouped by channel."
      />
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([method, items]) => (
        <div key={method} className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-2 text-[13px] font-semibold text-foreground">
            {toTitleCase(method)} <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
          </h3>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-foreground">Attempt {item.attempt_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.completed_at ? formatDateTime(item.completed_at) : `Scheduled ${formatDateTime(item.scheduled_at)}`}
                  </p>
                </div>
                {item.outcome && <StatusBadge status={item.outcome} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
