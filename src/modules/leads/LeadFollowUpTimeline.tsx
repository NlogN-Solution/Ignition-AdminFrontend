import { useState } from "react";
import { CalendarClock, Check, Circle, Clock, Loader2, MessageCircle, Phone, Plus, Users, Video, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPicker } from "@/components/shared/UserPicker";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { FollowUpMethod, FollowUpOutcome } from "@/types/enums";
import { formatDateTime, toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";
import { useCompleteFollowUp, useCreateFollowUp, useLeadFollowUps } from "./hooks";
import { MAX_FOLLOW_UP_ATTEMPTS, type LeadFollowUpRead } from "./types";

const METHOD_ICONS: Record<string, typeof Phone> = {
  phone_call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageCircle,
  in_person: Users,
  video_meeting: Video,
};

export function LeadFollowUpTimeline({ leadId, leadStatus }: { leadId: string; leadStatus: string }) {
  const { data, isLoading } = useLeadFollowUps(leadId);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const followUps = data?.items ?? [];
  const completedCount = followUps.filter((f) => f.completed_at).length;
  const atLimit = followUps.length >= MAX_FOLLOW_UP_ATTEMPTS;
  const canSchedule = leadStatus !== "lost" && !atLimit;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">
            {completedCount} / {MAX_FOLLOW_UP_ATTEMPTS} completed
          </p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: MAX_FOLLOW_UP_ATTEMPTS }).map((_, i) => {
              const attempt = followUps[i];
              const done = attempt?.completed_at;
              const scheduled = attempt && !attempt.completed_at;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium",
                    done ? "bg-success/15 text-success" : scheduled ? "bg-info/15 text-info" : "bg-muted text-muted-foreground/50",
                  )}
                  title={`Attempt ${i + 1}`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
              );
            })}
          </div>
        </div>
        <Button size="sm" disabled={!canSchedule} onClick={() => setScheduleOpen(true)} title={atLimit ? "7 attempt limit reached" : undefined}>
          <Plus className="h-3.5 w-3.5" /> Schedule follow-up
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : followUps.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No follow-ups yet" description="Schedule the first attempt to start the clock." className="border-none py-10" />
      ) : (
        <div className="space-y-2">
          {followUps.map((followUp) => {
            const Icon = METHOD_ICONS[followUp.method] ?? Phone;
            return (
              <div key={followUp.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-foreground">Attempt {followUp.attempt_number}</p>
                    <span className="text-xs text-muted-foreground">{toTitleCase(followUp.method)}</span>
                    {followUp.outcome ? (
                      <StatusBadge status={followUp.outcome} />
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> Scheduled
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {followUp.completed_at ? `Completed ${formatDateTime(followUp.completed_at)}` : `Scheduled ${formatDateTime(followUp.scheduled_at)}`}
                    {followUp.counsellor_id && (
                      <>
                        {" "}
                        · <StaffNameCell userId={followUp.counsellor_id} />
                      </>
                    )}
                  </p>
                  {followUp.notes && <p className="mt-1 text-xs text-muted-foreground">{followUp.notes}</p>}
                </div>
                {!followUp.completed_at && (
                  <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setCompletingId(followUp.id)}>
                    <Circle className="h-3 w-3" /> Complete
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ScheduleFollowUpDialog leadId={leadId} open={scheduleOpen} onOpenChange={setScheduleOpen} />
      {completingId && (
        <CompleteFollowUpDialog
          leadId={leadId}
          followUp={followUps.find((f) => f.id === completingId) ?? null}
          open={Boolean(completingId)}
          onOpenChange={(open) => !open && setCompletingId(null)}
        />
      )}
    </div>
  );
}

function ScheduleFollowUpDialog({ leadId, open, onOpenChange }: { leadId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createFollowUp = useCreateFollowUp(leadId);
  const [scheduledAt, setScheduledAt] = useState("");
  const [method, setMethod] = useState<string>(FollowUpMethod.PHONE_CALL);
  const [counsellorId, setCounsellorId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date & time</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FollowUpMethod).map((m) => (
                  <SelectItem key={m} value={m}>
                    {toTitleCase(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Counsellor</Label>
            <UserPicker value={counsellorId} onChange={setCounsellorId} placeholder="Defaults to you" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!scheduledAt || createFollowUp.isPending}
            onClick={() =>
              createFollowUp.mutate(
                {
                  scheduled_at: new Date(scheduledAt).toISOString(),
                  method: method as FollowUpMethod,
                  counsellor_id: counsellorId,
                  notes: notes || undefined,
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {createFollowUp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompleteFollowUpDialog({
  leadId,
  followUp,
  open,
  onOpenChange,
}: {
  leadId: string;
  followUp: LeadFollowUpRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const completeFollowUp = useCompleteFollowUp(leadId);
  const [outcome, setOutcome] = useState<string>(FollowUpOutcome.NO_ANSWER);
  const [notes, setNotes] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");

  if (!followUp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete attempt {followUp.attempt_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FollowUpOutcome).map((o) => (
                  <SelectItem key={o} value={o}>
                    {toTitleCase(o)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Next follow-up (optional)</Label>
            <Input type="datetime-local" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={completeFollowUp.isPending}
            onClick={() =>
              completeFollowUp.mutate(
                {
                  followUpId: followUp.id,
                  payload: {
                    outcome: outcome as FollowUpOutcome,
                    notes: notes || undefined,
                    next_follow_up_at: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
                  },
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {completeFollowUp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
