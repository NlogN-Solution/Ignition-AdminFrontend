import { Outlet } from "react-router";
import { Zap } from "lucide-react";

/**
 * The sign-in screen is the one place the ambient field is allowed to be seen
 * for its own sake: a single card of glass, centred, with the light behind it.
 */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-9 flex items-center justify-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[var(--shadow-1),var(--glass-sheen)]">
            <Zap className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.022em]">Ignition</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
