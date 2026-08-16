import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/errors";

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Enter your current password"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = (values: ChangePasswordForm) => {
    changePassword.mutate(values, {
      onSuccess: () => navigate("/", { replace: true }),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card p-7 shadow-sm"
    >
      <div className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Your account was created with a temporary password. Set your own before continuing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Temporary password</Label>
          <Input id="current_password" type="password" autoComplete="current-password" {...register("current_password")} />
          {errors.current_password && <p className="text-xs text-danger">{errors.current_password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new_password">New password</Label>
          <Input id="new_password" type="password" autoComplete="new-password" placeholder="••••••••" {...register("new_password")} />
          {errors.new_password && <p className="text-xs text-danger">{errors.new_password.message}</p>}
        </div>

        {changePassword.isError && (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            {getErrorMessage(changePassword.error, "Couldn't change password")}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={changePassword.isPending}>
          {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Set password
        </Button>
      </form>
    </motion.div>
  );
}
