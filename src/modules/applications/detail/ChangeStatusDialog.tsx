import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import { ApplicationStatus } from "@/types/enums";

/**
 * Move the application to a new status, with a reason.
 *
 * The header's Actions menu can set a status in one click, which is right for
 * the common case. This is the same mutation with the `remarks` field the
 * endpoint has always accepted and nothing in the UI ever sent — so the entry
 * that lands in Status History can say *why*, instead of being a bare
 * transition nobody can interpret three weeks later.
 */
export function ChangeStatusDialog({
  open,
  onOpenChange,
  current,
  isSaving,
  onSubmit,
  /**
   * Statuses that need a date and a letter, from the server's config.
   *
   * Passed in rather than imported so this component holds no opinion about
   * which statuses those are — the backend decides, and it refuses them on the
   * plain status endpoint, so submitting one from here would only produce a
   * 400 the counsellor cannot act on.
   */
  milestoneStatuses = [],
  onMilestone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: ApplicationStatus;
  isSaving: boolean;
  onSubmit: (status: ApplicationStatus, remarks?: string) => void;
  milestoneStatuses?: string[];
  onMilestone?: (status: ApplicationStatus) => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(current);
  const [remarks, setRemarks] = useState("");

  // A milestone is still selectable when it is the *current* status, because
  // correcting a mis-typed offer date is a real thing a counsellor does.
  const isMilestone = milestoneStatuses.includes(status) && Boolean(onMilestone);

  useEffect(() => {
    if (open) {
      setStatus(current);
      setRemarks("");
    }
  }, [open, current]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

          {/* Say so before they type a note they are about to lose. */}
          {isMilestone && (
            <p className="rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2.5 text-[12.5px] leading-relaxed text-foreground">
              {APPLICATION_STATUS_LABELS[status]} records something the university issued, so it needs
              its date and its letter. Continuing opens the form for those.
            </p>
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
            disabled={isSaving || (status === current && !isMilestone)}
            onClick={() =>
              isMilestone && onMilestone
                ? onMilestone(status)
                : onSubmit(status, remarks.trim() || undefined)
            }
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isMilestone ? "Continue" : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
