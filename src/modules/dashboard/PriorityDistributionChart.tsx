import { useQueries } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { leadService } from "@/modules/leads/service";
import { LeadPriority } from "@/types/enums";
import { toTitleCase } from "@/utils/format";

const PRIORITY_COLORS: Record<string, string> = {
  hot: "bg-danger",
  warm: "bg-warning",
  cold: "bg-info",
};

const PRIORITIES = [LeadPriority.HOT, LeadPriority.WARM, LeadPriority.COLD];

export function PriorityDistributionChart() {
  const navigate = useNavigate();
  const results = useQueries({
    queries: PRIORITIES.map((priority) => ({
      queryKey: ["dashboard", "priority-distribution", priority],
      queryFn: () => leadService.list({ priority, exclude_status: "converted" as const, limit: 1 }),
    })),
  });

  const counts = results.map((r) => r.data?.total ?? 0);
  const max = Math.max(...counts, 1);
  const isLoading = results.some((r) => r.isLoading);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 text-[13px] font-medium text-foreground">Priority distribution</p>
      <div className="space-y-3">
        {PRIORITIES.map((priority, idx) => (
          <button
            key={priority}
            onClick={() => navigate(`/leads?priority=${priority}`)}
            className="group flex w-full items-center gap-3 text-left"
          >
            <span className="w-12 shrink-0 text-xs text-muted-foreground group-hover:text-foreground">{toTitleCase(priority)}</span>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isLoading ? "0%" : `${Math.max((counts[idx] / max) * 100, counts[idx] > 0 ? 6 : 0)}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.05 }}
                className={`h-full rounded-md ${PRIORITY_COLORS[priority]}`}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">{counts[idx]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
