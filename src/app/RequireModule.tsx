import type { ReactNode } from "react";
import { Hammer, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/services/authStore";
import { canAccessModule, isComingSoon, type ModuleKey } from "@/constants/permissions";

/**
 * The route guard. Two refusals, in this order.
 *
 * **Under construction comes first**, before the role check. A module nobody
 * should be using yet is not a permissions question, and answering "ask an
 * administrator for access" would send someone to ask for something that
 * cannot be granted.
 *
 * This is also the half that a typed URL cannot skip. Greying out the sidebar
 * link is a suggestion; this is the part that means it.
 */
export function RequireModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);

  if (isComingSoon(module)) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Hammer className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-sm font-medium text-foreground">This module is under development</p>
          <p className="text-sm text-muted-foreground">
            It is on the roadmap and appears in the navigation so you can see what is coming — but it
            is not ready to be used yet, and nothing you do here would be saved.
          </p>
        </div>
      </div>
    );
  }

  if (!canAccessModule(role, module)) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">You don't have access to this workspace area</p>
          <p className="text-sm text-muted-foreground">Ask an administrator to grant your role access.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
