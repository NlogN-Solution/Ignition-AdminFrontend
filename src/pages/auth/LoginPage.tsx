import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/errors";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * The sheet itself stays quiet: the composition around it (see `AuthLayout`)
 * carries the personality, and a sign-in form that draws attention to itself is
 * a sign-in form somebody has to read rather than complete. What it does spend
 * effort on is the things people actually hit: focus lands in the email field,
 * the password can be revealed, and the errors are tied to their inputs for a
 * screen reader. The refusal stays deliberately vague about *which* of the two
 * was wrong — naming it would confirm to a stranger that an address has an
 * account behind it.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginForm) => {
    login.mutate(values, {
      onSuccess: () => {
        const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
        navigate(redirectTo, { replace: true });
      },
    });
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-[calc(var(--radius)*1.7)] bg-card p-7 shadow-[var(--shadow-3),var(--glass-sheen)] ring-1 ring-[var(--border)] backdrop-blur-[var(--glass-sheet)] sm:p-8"
    >
      <div className="mb-7 space-y-1.5">
        <h2 className="text-[22px] font-semibold tracking-[-0.026em] text-foreground">
          Sign in to Ignition
        </h2>
        <p className="text-[13.5px] leading-[1.5] text-muted-foreground">
          Use the work address your administrator set up.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@consultancy.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-10"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={revealed ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-10 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setRevealed((current) => !current)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        {login.isError && (
          <p role="alert" className="rounded-[var(--radius-md)] bg-danger/10 px-3 py-2.5 text-xs leading-[1.45] text-danger">
            {getErrorMessage(login.error, "That email and password don't match an account.")}
          </p>
        )}

        <Button type="submit" className="h-10 w-full" disabled={login.isPending}>
          {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-[12.5px] leading-[1.5] text-muted-foreground">
        Locked out, or no account yet? Ask your administrator — staff accounts are created for you.
      </p>
    </motion.div>
  );
}
