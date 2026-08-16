import { useNavigate } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { motion } from "motion/react";
import { leadService } from "@/modules/leads/service";
import { LEAD_STATUS_PIPELINE } from "@/modules/leads/types";
import { toTitleCase } from "@/utils/format";
import { toneForStatus } from "@/utils/statusTone";

const BAR_COLOR: Record<string, string> = {
  neutral: "bg-muted-foreground/60",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

function destinationFor(status: string): string {
  if (status === "converted") return "/applicants";
  if (status === "qualified") return "/leads?tab=prospect";
  return "/leads?tab=raw";
}

export function LeadFunnelWidget() {
  const navigate = useNavigate();
  const results = useQueries({
    queries: LEAD_STATUS_PIPELINE.map((status) => ({
      queryKey: ["dashboard", "funnel", status],
      queryFn: () => leadService.list({ status, limit: 1 }),
    })),
  });

  const counts = results.map((r) => r.data?.total ?? 0);
  const max = Math.max(...counts, 1);
  const isLoading = results.some((r) => r.isLoading);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-0.5 text-[13px] font-semibold text-foreground">Conversion funnel</h2>
      <p className="mb-4 text-xs text-muted-foreground">Raw Lead → Prospect → Client</p>
      <div className="space-y-3">
        {LEAD_STATUS_PIPELINE.map((status, idx) => {
          const count = counts[idx];
          const tone = toneForStatus(status);
          return (
            <button
              key={status}
              onClick={() => navigate(destinationFor(status))}
              className="group flex w-full items-center gap-3 text-left"
            >
              <span className="w-24 shrink-0 text-xs text-muted-foreground group-hover:text-foreground">{toTitleCase(status)}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isLoading ? "0%" : `${Math.max((count / max) * 100, count > 0 ? 6 : 0)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.05 }}
                  className={`h-full rounded-md ${BAR_COLOR[tone]}`}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
