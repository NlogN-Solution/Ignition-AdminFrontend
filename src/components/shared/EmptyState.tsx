import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3.5 rounded-2xl px-6 py-20 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] shadow-[var(--glass-sheen)] dark:bg-white/[0.06]">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-medium tracking-[-0.012em] text-foreground">{title}</p>
        {description && <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
