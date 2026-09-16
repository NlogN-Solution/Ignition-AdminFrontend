import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import type { ApplicationRead, StatusRequirement } from "@/modules/applications/types";
import type { ApplicationStatus } from "@/types/enums";
import { MilestoneFields, useMilestoneForm, type MilestonePayload } from "./MilestoneFields";

/**
 * Recording — or correcting — something a university issued, on its own.
 *
 * The usual way to record an offer is to change the status to "Offer
 * received", and `ChangeStatusDialog` now collects the date and the letter
 * inline while you do it. This dialog is the other door: the Evidence card on
 * the Overview tab, used when the status is already right and what needs
 * fixing is a mistyped date or a letter that was the wrong file.
 *
 * Both share `MilestoneFields`, so the two doors lead to the same room. It
 * submits once; the backend writes the date, links the letter, moves the
 * status, records the milestone and notifies the student inside one
 * transaction — see `MilestoneService.record`.
 */
export function RecordMilestoneDialog({
  open,
  onOpenChange,
  status,
  requirement,
  application,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ApplicationStatus;
  requirement: StatusRequirement;
  application: ApplicationRead;
  isSaving: boolean;
  onSubmit: (payload: MilestonePayload) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const form = useMilestoneForm({ requirement, application, reset: open });

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record {APPLICATION_STATUS_LABELS[status].toLowerCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">{requirement.prompt}</p>

          <MilestoneFields form={form} idPrefix="record" />

          <div className="space-y-1.5">
            <Label htmlFor="record-remarks">Notes (optional)</Label>
            <Textarea
              id="record-remarks"
              rows={2}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Anything worth recording against the transition."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            disabled={isSaving || !form.isComplete}
            onClick={() => onSubmit(form.payload(status, remarks.trim()))}
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save &amp; notify applicant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
