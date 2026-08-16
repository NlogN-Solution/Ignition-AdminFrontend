import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GeneratedPasswordReveal } from "./GeneratedPasswordReveal";
import { useEnableStudentPortal } from "./hooks";
import type { UserRead } from "./types";

/** For a student converted without portal access at the time — generates their first password on demand. */
export function EnablePortalDialog({ user, open, onOpenChange }: { user: UserRead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const enablePortal = useEnableStudentPortal();
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPassword(null);
  }, [open]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enable student portal</DialogTitle>
          {!password && <DialogDescription>Generate login credentials so {user.first_name} can access their student portal.</DialogDescription>}
        </DialogHeader>

        {password ? (
          <GeneratedPasswordReveal password={password} name={user.first_name} />
        ) : (
          <p className="text-[13px] text-muted-foreground">They'll log in with {user.email} and a one-time password you share with them.</p>
        )}

        <DialogFooter>
          {password ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={enablePortal.isPending}
                onClick={() => enablePortal.mutate(user.id, { onSuccess: (result) => setPassword(result.generated_password) })}
              >
                {enablePortal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Enable portal
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
