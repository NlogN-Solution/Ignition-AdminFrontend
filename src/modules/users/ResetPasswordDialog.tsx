import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "./hooks";
import type { UserRead } from "./types";

export function ResetPasswordDialog({ user, open, onOpenChange }: { user: UserRead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const resetPassword = useResetPassword();
  const [newPassword, setNewPassword] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword("");
      setGenerated(null);
      setCopied(false);
    }
  }, [open]);

  if (!user) return null;

  function handleSubmit() {
    if (!user) return;
    resetPassword.mutate(
      { id: user.id, newPassword: newPassword || undefined },
      { onSuccess: (result) => setGenerated(result.generated_password) },
    );
  }

  function handleCopy() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              Share this password with {user.first_name} through a secure channel — it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={generated} className="font-mono" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>New password (optional)</Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to auto-generate a secure password"
            />
          </div>
        )}

        <DialogFooter>
          {generated ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={resetPassword.isPending} onClick={handleSubmit}>
                {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Reset password
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
