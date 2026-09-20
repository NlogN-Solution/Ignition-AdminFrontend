import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/errors";

/**
 * Changing your own password, from the settings page.
 *
 * `POST /auth/change-password` has always existed, and the only screen that
 * reached it was `/change-password` — which you are *sent* to when your account
 * is flagged `must_change_password`. So a staff member who simply wanted to
 * change their password had nowhere to do it.
 *
 * Two-factor and email verification are not here on purpose: `users` has
 * `two_factor_enabled` and `email_verified_at` columns, but there is no
 * endpoint, no mailer and no TOTP implementation behind either. A switch that
 * sets a flag nothing checks would tell someone they are protected when they
 * are not.
 */
export function SecurityCard() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Your new password needs at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two new passwords don't match.");
      return;
    }

    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          toast.success("Password changed. You're signed out everywhere else.");
        },
        onError: (caught) => setError(getErrorMessage(caught, "Couldn't change your password.")),
      },
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <h2 className="text-[13px] font-semibold text-foreground">Password</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Changing it signs you out of every other device and browser.
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="current-password" className="text-xs text-muted-foreground">
            Current password
          </Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-xs text-muted-foreground">
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <p className="text-[11px] text-muted-foreground/80">At least 8 characters.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
            Confirm new password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={changePassword.isPending || !currentPassword || !newPassword}>
          {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Change password
        </Button>
      </form>
    </section>
  );
}
