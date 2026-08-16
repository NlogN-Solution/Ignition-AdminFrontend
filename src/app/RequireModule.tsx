import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/services/authStore";
import { canAccessModule, type ModuleKey } from "@/constants/permissions";

export function RequireModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);

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
