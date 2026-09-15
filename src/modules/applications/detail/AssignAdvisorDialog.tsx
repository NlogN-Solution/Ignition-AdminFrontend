import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPicker } from "@/components/shared/UserPicker";
import { UserRole } from "@/types/enums";

/**
 * Assign the counsellor who owns this application.
 *
 * Writes `counsellor_id` through the existing `useUpdateApplication` mutation —
 * no new endpoint, no new field. It exists because the only previous way to set
 * an advisor was the create dialog, so an application created without one could
 * never be given one from this page.
 */
export function AssignAdvisorDialog({
  open,
  onOpenChange,
  currentId,
  isSaving,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId: string | null;
  isSaving: boolean;
  onAssign: (userId: string) => void;
}) {
  const [userId, setUserId] = useState<string | undefined>(currentId ?? undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign advisor</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="advisor">Counsellor</Label>
          <UserPicker value={userId} onChange={setUserId} role={UserRole.COUNSELLOR} placeholder="Select counsellor…" />
        </div>
        <DialogFooter>
          <Button disabled={!userId || isSaving} onClick={() => userId && onAssign(userId)}>
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
