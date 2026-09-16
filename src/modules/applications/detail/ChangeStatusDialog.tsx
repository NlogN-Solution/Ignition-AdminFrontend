import { useEffect, useState } from "react";
import { Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import type { ApplicationRead, StatusRequirement } from "@/modules/applications/types";
import { ApplicationStatus } from "@/types/enums";
import { MilestoneFields, useMilestoneForm, type MilestonePayload } from "./MilestoneFields";

/**
 * Move the application to a new status — and, where the status is one a
 * university issued, record what proves it in the same breath.
 *
 * ## Why the evidence is in here
 *
 * Three statuses are not Ignition reporting its own progress but events that
 * happened somewhere else: an offer, a CAS, a visa decision. The backend
 * refuses them on the plain status endpoint precisely so that one cannot be
 * recorded without its date and its letter
 * (`services/status_requirements.py`).
 *
 * This dialog used to acknowledge that by *stopping*: pick "Offer received",
 * read a paragraph explaining that it needs more, press Continue, and a second
 * dialog opened to collect it. Two dialogs for one action, the second of which
 * asked the question the first had already interrupted to warn about.
 *
 * Now the fields appear underneath the picker the moment a milestone status is
 * chosen. Same one request, same transaction on the far side — the backend
 * writes the date, files the letter, moves the status, records the milestone
 * and notifies the applicant together, which is what drives the celebration on
 * the student's dashboard.
 *
 * ## It renders the requirement, it does not know it
 *
 * `requirements` is the server's config, fetched. This component holds no
 * opinion about which statuses need evidence or what evidence they need, so
 * adding a fourth milestone is a row in a Python table and nothing here.
 *
 * **When `requirements` arrives empty, every status takes the plain path.**
 * That is the correct degradation and it is also how this broke in production:
 * `GET /applications/status-requirements` was being swallowed by
 * `GET /applications/{application_id}` and 422ing, so the console believed no
 * status needed evidence, posted `offer_received` to the plain endpoint, and
 * showed the counsellor the backend's refusal — "Use POST
 * /applications/{id}/milestone" — as though it were advice.
 */
export function ChangeStatusDialog({
  open,
  onOpenChange,
  application,
  isSaving,
  onSubmit,
  requirements = [],
  onRecordMilestone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationRead;
  isSaving: boolean;
  onSubmit: (status: ApplicationStatus, remarks?: string) => void;
  requirements?: StatusRequirement[];
  onRecordMilestone: (payload: MilestonePayload) => void;
}) {
  const current = application.status;
  const [status, setStatus] = useState<ApplicationStatus>(current);
  const [remarks, setRemarks] = useState("");

  // A milestone is still selectable when it is the *current* status, because
  // correcting a mis-typed offer date is a real thing a counsellor does.
  const requirement = requirements.find((item) => item.status === status);
  const milestone = useMilestoneForm({ requirement, application, reset: `${open}:${status}` });

  useEffect(() => {
    if (open) {
      setStatus(current);
      setRemarks("");
    }
  }, [open, current]);

  const unchanged = status === current && !milestone;
  const blocked = isSaving || unchanged || (milestone ? !milestone.isComplete : false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Taller than the plain dialog because the milestone form unfolds into
          it; scrolls rather than growing past the viewport on a laptop. */}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-status">New status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger id="new-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Object.values(ApplicationStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {APPLICATION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {milestone && (
            <div className="space-y-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
              <p className="text-[12.5px] leading-relaxed text-foreground">
                {milestone.requirement.prompt}
              </p>
              <MilestoneFields form={milestone} idPrefix="status" />
              <p className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                <PartyPopper className="mt-px h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                Saving notifies the applicant and shows them the good news on their dashboard.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="status-remarks">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="status-remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Why is it moving? This is recorded against the status history."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            disabled={blocked}
            onClick={() =>
              milestone
                ? onRecordMilestone(milestone.payload(status, remarks.trim()))
                : onSubmit(status, remarks.trim() || undefined)
            }
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {milestone ? "Save & notify applicant" : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
