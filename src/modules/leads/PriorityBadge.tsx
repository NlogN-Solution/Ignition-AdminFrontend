import { cn } from "@/lib/utils";
import type { LeadPriority } from "@/types/enums";

const PRIORITY_STYLES: Record<LeadPriority, { label: string; dot: string; text: string; bg: string }> = {
  hot: { label: "Hot", dot: "bg-danger", text: "text-danger", bg: "bg-danger/10" },
  warm: { label: "Warm", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10" },
  cold: { label: "Cold", dot: "bg-info", text: "text-info", bg: "bg-info/10" },
};

export function PriorityBadge({ priority, className }: { priority: LeadPriority; className?: string }) {
  const style = PRIORITY_STYLES[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", style.bg, style.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
