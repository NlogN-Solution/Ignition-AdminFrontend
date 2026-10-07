import { useEffect, useRef, useState } from "react";
import {
  Ban,
  CalendarPlus,
  Check,
  Circle,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Route,
  SkipForward,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { documentService } from "@/modules/documents/service";
import { openDocumentFile } from "@/modules/documents/openDocument";
import { useUpdateWorkflowStep } from "@/modules/application-workflow/hooks";
import { ApplicationStatus, DocumentType, WorkflowStepStatus } from "@/types/enums";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import { getErrorMessage } from "@/utils/errors";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  journeyKeys,
  useApplicationJourney,
  usePublishSlots,
  useRecordOutcome,
  useReviewSubmission,
  useSwitchJourney,
  useWithdrawSlot,
} from "./hooks";
import { isInteractive, type Journey, type JourneySlot, type JourneyStep, type SlotOutcome } from "./types";

/**
 * The staff half of the application journey.
 *
 * `student-journey.html` drew this as dashed "demo controls" under each
 * student screen. Here they are real: verify or send back a review round,
 * offer interview slots and record the outcome, and record the offer or CAS
 * through the existing milestone dialog (an issued stage has no button of its
 * own — the status is the source of truth, and recording it completes the
 * stage on the server).
 *
 * Only the current stage takes actions. The server refuses the others with a
 * 409; the screen does not offer them.
 */

const STEP_STYLES: Record<string, { icon: LucideIcon; dot: string; label: string }> = {
  completed: { icon: Check, dot: "bg-success text-white", label: "Completed" },
  current: { icon: Circle, dot: "bg-info text-white", label: "In progress" },
  pending: { icon: Circle, dot: "bg-muted text-muted-foreground/60 border border-border", label: "Upcoming" },
  failed: { icon: X, dot: "bg-danger text-white", label: "Failed" },
  skipped: { icon: SkipForward, dot: "bg-muted text-muted-foreground", label: "Skipped" },
  cancelled: { icon: Ban, dot: "bg-muted text-muted-foreground", label: "Cancelled" },
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  pending: "Needed",
  submitted: "Uploaded · to verify",
  verified: "Verified",
  rejected: "Rejected",
  waived: "Waived",
};

interface Props {
  applicationId: string;
  studentId: string;
  canManage: boolean;
  /** Opens the existing milestone dialog for an offer or CAS. */
  onRecordMilestone: (status: ApplicationStatus) => void;
  onOpenDocuments: () => void;
}

export function JourneyWorkspace({ applicationId, studentId, canManage, onRecordMilestone, onOpenDocuments }: Props) {
  const { data: journey, isLoading } = useApplicationJourney(applicationId);
  const switchJourney = useSwitchJourney(applicationId);
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const switchDialog = (
    <Dialog open={confirmSwitch} onOpenChange={setConfirmSwitch}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch to the country's journey?</DialogTitle>
          <DialogDescription>
            The current workflow is replaced by the journey for this university's country. Stages up to the
            application's current status are marked done. Uploaded documents are kept; empty requests from the old
            workflow are removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmSwitch(false)}>
            Cancel
          </Button>
          <Button
            disabled={switchJourney.isPending}
            onClick={() => switchJourney.mutate(undefined, { onSuccess: () => setConfirmSwitch(false) })}
          >
            {switchJourney.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Switch journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!journey || !isInteractive(journey)) {
    return (
      <>
        <EmptyState
          icon={Route}
          title="No interactive journey"
          description={
            journey
              ? `This application follows "${journey.template_name}", which has no student-facing stages. UK applications use the UK Student Journey.`
              : "This application has no workflow yet."
          }
          action={
            canManage ? (
              <Button onClick={() => setConfirmSwitch(true)}>
                <Route className="h-4 w-4" />
                Use the country's journey
              </Button>
            ) : undefined
          }
        />
        {switchDialog}
      </>
    );
  }

  return (
    <>
      <Workspace
        journey={journey}
        applicationId={applicationId}
        studentId={studentId}
        canManage={canManage}
        onRecordMilestone={onRecordMilestone}
        onOpenDocuments={onOpenDocuments}
        onSwitch={() => setConfirmSwitch(true)}
      />
      {switchDialog}
    </>
  );
}

function Workspace({
  journey,
  applicationId,
  studentId,
  canManage,
  onRecordMilestone,
  onOpenDocuments,
  onSwitch,
}: {
  journey: Journey;
  applicationId: string;
  studentId: string;
  canManage: boolean;
  onRecordMilestone: (status: ApplicationStatus) => void;
  onOpenDocuments: () => void;
  onSwitch: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(journey.current_step_id);
  useEffect(() => {
    if (journey.current_step_id) setSelectedId(journey.current_step_id);
  }, [journey.current_step_id]);
  const step = journey.steps.find((s) => s.id === selectedId) ?? journey.steps[0];
  const waitingOnStaff = journey.steps.filter((s) => s.waiting_on === "staff").length;

  return (
    <section aria-label="Journey" className="rounded-2xl bg-card ring-1 ring-[var(--border)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">{journey.template_name}</h2>
          <p className="text-[13px] text-muted-foreground">
            {journey.study_level === "pg" ? "Postgraduate" : "Undergraduate"}
            {journey.has_study_gap && " · study gap over 6 months"}
            {" · "}
            {journey.progress_percent}% complete
            {journey.status === "cancelled" && " · ended"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {waitingOnStaff > 0 && (
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[12px] font-medium text-warning">
              Waiting on staff
            </span>
          )}
          {canManage && (
            <Button size="sm" variant="outline" onClick={onSwitch}>
              Switch journey
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ol className="flex gap-1 overflow-x-auto border-b border-border p-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
          {journey.steps.map((s, i) => {
            const style = STEP_STYLES[s.status] ?? STEP_STYLES.pending;
            const Icon = style.icon;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    s.id === step.id ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]", style.dot)}>
                    {s.status === "pending" || s.status === "current" ? i + 1 : <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium text-foreground">{s.name}</span>
                    <span className={cn("block text-[12px]", s.waiting_on === "staff" ? "text-warning" : "text-muted-foreground")}>
                      {s.waiting_on === "staff" ? "Needs you" : s.waiting_on === "student" ? "With the student" : style.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="min-w-0 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">{step.name}</h3>
              {step.description && <p className="mt-0.5 text-[13px] text-muted-foreground">{step.description}</p>}
            </div>
            <StatusBadge status={step.status} />
          </div>
          <StagePanel
            key={step.id}
            step={step}
            applicationId={applicationId}
            studentId={studentId}
            canManage={canManage}
            onRecordMilestone={onRecordMilestone}
            onOpenDocuments={onOpenDocuments}
          />
          {canManage && step.status === WorkflowStepStatus.CURRENT && (step.kind === "info" || step.kind === "checklist") && (
            <ManualComplete applicationId={applicationId} step={step} />
          )}
        </div>
      </div>
    </section>
  );
}

function StagePanel(props: {
  step: JourneyStep;
  applicationId: string;
  studentId: string;
  canManage: boolean;
  onRecordMilestone: (status: ApplicationStatus) => void;
  onOpenDocuments: () => void;
}) {
  switch (props.step.kind) {
    case "documents":
      return <DocumentsPanel {...props} />;
    case "issued":
      return <IssuedPanel {...props} />;
    case "review":
      return <ReviewPanel {...props} />;
    case "booking":
      return <BookingPanel {...props} />;
    case "checklist":
      return <ChecklistPanel step={props.step} />;
    default:
      return <p className="mt-4 text-[13.5px] text-muted-foreground">Move this stage by hand when it is done.</p>;
  }
}

/* ---------------------------------------------------------------- documents --- */

function DocumentsPanel({ step, onOpenDocuments }: { step: JourneyStep; onOpenDocuments: () => void }) {
  const items = step.checklist.filter((i) => i.status !== "waived");
  return (
    <div className="mt-4 space-y-3">
      {step.progress.submitted_at && (
        <p className="text-[13px] text-muted-foreground">
          Submitted by the student {formatRelativeTime(step.progress.submitted_at)}.
        </p>
      )}
      <ul className="divide-y divide-border rounded-xl ring-1 ring-[var(--border)]">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px]">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{item.custom_label ?? item.document_type}</span>
            <span
              className={cn(
                "text-[12px]",
                item.status === "verified" && "text-success",
                item.status === "submitted" && "text-warning",
                item.status === "rejected" && "text-danger",
                item.status === "pending" && "text-muted-foreground",
              )}
            >
              {ITEM_STATUS_LABEL[item.status] ?? item.status}
            </span>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="outline" onClick={onOpenDocuments}>
        Verify in Documents
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------- issued --- */

function IssuedPanel({
  step,
  canManage,
  onRecordMilestone,
}: {
  step: JourneyStep;
  canManage: boolean;
  onRecordMilestone: (status: ApplicationStatus) => void;
}) {
  const status = step.config.milestone_status as ApplicationStatus | undefined;
  const what = status === ApplicationStatus.CAS_RECEIVED ? "CAS" : "offer";
  if (step.status === WorkflowStepStatus.COMPLETED) {
    return <p className="mt-4 text-[13.5px] text-success">The {what} has been recorded.</p>;
  }
  if (step.status !== WorkflowStepStatus.CURRENT) {
    return <p className="mt-4 text-[13.5px] text-muted-foreground">Opens once the stages before it are done.</p>;
  }
  return (
    <div className="mt-4 space-y-3">
      <p className="text-[13.5px] text-muted-foreground">
        The student is waiting for the university. When the {what} arrives, record it with its date and letter — that
        completes this stage, notifies the student and moves the application's status.
      </p>
      {canManage && status && (
        <Button size="sm" onClick={() => onRecordMilestone(status)}>
          Record the {what}
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- review --- */

function ReviewPanel({
  step,
  applicationId,
  studentId,
  canManage,
}: {
  step: JourneyStep;
  applicationId: string;
  studentId: string;
  canManage: boolean;
}) {
  const review = useReviewSubmission(applicationId);
  const [feedback, setFeedback] = useState("");
  const [attachments, setAttachments] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const latest = step.submissions[step.submissions.length - 1];
  const awaitingReview = step.status === WorkflowStepStatus.CURRENT && latest?.status === "submitted";

  const attach = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await documentService.upload({
        student_id: studentId,
        document_type: DocumentType.OTHER,
        file,
        title: `Feedback: ${step.name}`,
        application_id: applicationId,
      });
      setAttachments((current) => [...current, { id: uploaded.id, name: file.name }]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't attach that file"));
    } finally {
      setUploading(false);
    }
  };

  const decide = (verdict: "verified" | "changes_requested") =>
    latest &&
    review.mutate(
      {
        submissionId: latest.id,
        payload: { verdict, feedback: feedback.trim() || null, attachment_ids: attachments.map((a) => a.id) },
      },
      {
        onSuccess: () => {
          setFeedback("");
          setAttachments([]);
        },
      },
    );

  return (
    <div className="mt-4 space-y-4">
      {step.config.resources && step.config.resources.length > 0 && (
        <p className="text-[12.5px] text-muted-foreground">
          The student sees {step.config.resources.length} resources here. Edit them in the workflow template.
        </p>
      )}

      {step.submissions.length === 0 ? (
        <p className="text-[13.5px] text-muted-foreground">
          {step.status === WorkflowStepStatus.CURRENT ? "Nothing handed in yet." : "Not open yet."}
        </p>
      ) : (
        <ol className="space-y-3">
          {[...step.submissions].reverse().map((sub) => (
            <li key={sub.id} className="rounded-xl p-3.5 ring-1 ring-[var(--border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold">
                  Round {sub.round} · {formatRelativeTime(sub.created_at)}
                </span>
                <StatusBadge status={sub.status} />
              </div>
              {sub.body_text && (
                <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-line text-[13.5px] leading-relaxed">{sub.body_text}</p>
              )}
              {sub.document_id && (
                <button
                  type="button"
                  onClick={() => void openDocumentFile(sub.document_id as string, "inline")}
                  className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" /> {sub.document_name ?? "Open file"}
                </button>
              )}
              {sub.external_url && (
                <a
                  href={sub.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-1.5 break-all text-[13px] font-medium text-primary hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5 shrink-0" /> {sub.external_url}
                </a>
              )}
              {sub.feedback && (
                <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-[13px]">
                  <span className="font-semibold">Feedback: </span>
                  {sub.feedback}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {awaitingReview && canManage && (
        <div className="space-y-2.5 rounded-xl bg-muted/50 p-3.5">
          <Label htmlFor={`fb-${step.id}`}>Feedback for the student</Label>
          <Textarea
            id={`fb-${step.id}`}
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Needed when sending it back. Optional when verifying."
          />
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInput} type="file" className="hidden" onChange={(e) => { void attach(e.target.files?.[0]); e.target.value = ""; }} />
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
              Attach a document
            </Button>
            {attachments.map((a) => (
              <span key={a.id} className="rounded-full bg-card px-2.5 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
                {a.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" disabled={review.isPending} onClick={() => decide("verified")}>
              <Check className="h-3.5 w-3.5" /> Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={review.isPending || !feedback.trim()}
              onClick={() => decide("changes_requested")}
            >
              Send back with feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ booking --- */

const emptySlot = { starts_at: "", location: "", meeting_link: "" };

function BookingPanel({
  step,
  applicationId,
  canManage,
}: {
  step: JourneyStep;
  applicationId: string;
  canManage: boolean;
}) {
  const publish = usePublishSlots(applicationId);
  const withdraw = useWithdrawSlot(applicationId);
  const outcome = useRecordOutcome(applicationId);
  const [drafts, setDrafts] = useState([{ ...emptySlot }]);
  const [note, setNote] = useState("");
  const [confirmFail, setConfirmFail] = useState<JourneySlot | null>(null);

  const isOpen = step.status === WorkflowStepStatus.CURRENT;
  const booked = step.slots.find((s) => s.status === "booked");
  const visible = step.slots.filter((s) => s.status !== "withdrawn");
  const allowReschedule = step.config.allow_reschedule !== false;
  const failEnds = Boolean(step.config.fail_ends_journey);

  const submitSlots = () => {
    const slots = drafts
      .filter((d) => d.starts_at)
      .map((d) => ({
        starts_at: new Date(d.starts_at).toISOString(),
        location: d.location.trim() || null,
        meeting_link: d.meeting_link.trim() || null,
      }));
    if (slots.length === 0) return;
    publish.mutate({ stepId: step.id, slots }, { onSuccess: () => setDrafts([{ ...emptySlot }]) });
  };

  const decide = (slot: JourneySlot, result: SlotOutcome) =>
    outcome.mutate(
      { slotId: slot.id, outcome: result, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote("");
          setConfirmFail(null);
        },
      },
    );

  return (
    <div className="mt-4 space-y-4">
      {visible.length > 0 && (
        <ul className="space-y-2">
          {visible.map((slot) => (
            <li key={slot.id} className="flex flex-wrap items-center gap-3 rounded-xl px-3.5 py-2.5 ring-1 ring-[var(--border)]">
              <span className="min-w-0 flex-1 text-[13.5px]">
                <span className="font-medium">{formatDateTime(slot.starts_at)}</span>
                <span className="text-muted-foreground">
                  {" · attempt "}
                  {slot.attempt}
                  {slot.location && ` · ${slot.location}`}
                </span>
                {slot.meeting_link && (
                  <a href={slot.meeting_link} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> link
                  </a>
                )}
              </span>
              <StatusBadge status={slot.outcome ?? slot.status} />
              {canManage && isOpen && slot.status === "open" && (
                <Button size="icon" variant="ghost" aria-label="Withdraw slot" disabled={withdraw.isPending} onClick={() => withdraw.mutate(slot.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && isOpen && booked && (
        <div className="space-y-2.5 rounded-xl bg-muted/50 p-3.5">
          <p className="text-[13.5px] font-medium">Booked for {formatDateTime(booked.starts_at)}. How did it go?</p>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the student (optional)" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={outcome.isPending} onClick={() => decide(booked, "passed")}>
              <Check className="h-3.5 w-3.5" /> Passed
            </Button>
            {allowReschedule && (
              <Button size="sm" variant="outline" disabled={outcome.isPending} onClick={() => decide(booked, "reschedule")}>
                Needs another attempt
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-danger" disabled={outcome.isPending} onClick={() => setConfirmFail(booked)}>
              <X className="h-3.5 w-3.5" /> Failed
            </Button>
          </div>
        </div>
      )}

      {canManage && isOpen && !booked && (
        <div className="space-y-2.5 rounded-xl bg-muted/50 p-3.5">
          <p className="text-[13.5px] font-medium">Offer interview times</p>
          {drafts.map((draft, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Input
                type="datetime-local"
                aria-label="Start time"
                value={draft.starts_at}
                onChange={(e) => setDrafts((all) => all.map((d, j) => (j === i ? { ...d, starts_at: e.target.value } : d)))}
              />
              <Input
                placeholder="Location (optional)"
                value={draft.location}
                onChange={(e) => setDrafts((all) => all.map((d, j) => (j === i ? { ...d, location: e.target.value } : d)))}
              />
              <Input
                placeholder="Meeting link (optional)"
                value={draft.meeting_link}
                onChange={(e) => setDrafts((all) => all.map((d, j) => (j === i ? { ...d, meeting_link: e.target.value } : d)))}
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remove row"
                disabled={drafts.length === 1}
                onClick={() => setDrafts((all) => all.filter((_, j) => j !== i))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={drafts.length >= 6} onClick={() => setDrafts((all) => [...all, { ...emptySlot }])}>
              <Plus className="h-3.5 w-3.5" /> Another time
            </Button>
            <Button size="sm" disabled={publish.isPending || !drafts.some((d) => d.starts_at)} onClick={submitSlots}>
              <CalendarPlus className="h-3.5 w-3.5" /> Offer to the student
            </Button>
          </div>
          <p className="text-[12px] text-muted-foreground">Times are in your browser's timezone. The student picks one; the rest are withdrawn.</p>
        </div>
      )}

      {!isOpen && visible.length === 0 && <p className="text-[13.5px] text-muted-foreground">Not open yet.</p>}

      <Dialog open={Boolean(confirmFail)} onOpenChange={(open) => !open && setConfirmFail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a fail?</DialogTitle>
            <DialogDescription>
              {failEnds
                ? "This ends the journey: the remaining stages are closed and the application is marked not successful. The student is notified."
                : "The stage is marked failed and the student is notified."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFail(null)}>
              Cancel
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              disabled={outcome.isPending}
              onClick={() => confirmFail && decide(confirmFail, "failed")}
            >
              Record fail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------------------------------------------------------- checklist --- */

function ChecklistPanel({ step }: { step: JourneyStep }) {
  const ticks = step.progress.tasks ?? {};
  return (
    <ul className="mt-4 divide-y divide-border rounded-xl ring-1 ring-[var(--border)]">
      {(step.config.tasks ?? []).map((task) => (
        <li key={task.key} className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px]">
          <span
            className={cn(
              "flex h-4.5 w-4.5 items-center justify-center rounded border",
              ticks[task.key] ? "border-success bg-success text-white" : "border-border",
            )}
          >
            {ticks[task.key] && <Check className="h-3 w-3" />}
          </span>
          <span className={cn("flex-1", ticks[task.key] && "text-muted-foreground line-through")}>{task.label}</span>
          {ticks[task.key] && <span className="text-[12px] text-muted-foreground">{formatRelativeTime(ticks[task.key])}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------- manual override --- */

/** For stages nothing in the portal completes (info), or a checklist staff confirm by hand. */
function ManualComplete({ applicationId, step }: { applicationId: string; step: JourneyStep }) {
  const update = useUpdateWorkflowStep(applicationId);
  const queryClient = useQueryClient();
  return (
    <Button
      size="sm"
      variant="outline"
      className="mt-4"
      disabled={update.isPending}
      onClick={() =>
        update.mutate(
          { stepId: step.id, payload: { status: WorkflowStepStatus.COMPLETED } },
          { onSuccess: () => queryClient.invalidateQueries({ queryKey: journeyKeys.detail(applicationId) }) },
        )
      }
    >
      Mark stage complete
    </Button>
  );
}
