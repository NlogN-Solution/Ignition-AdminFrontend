import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Mail, Phone } from "lucide-react";
import { useLeads } from "./hooks";
import { STAGE_LABELS, STAGE_PIPELINE, STATUSES_BY_STAGE, type LeadStage } from "./types";
import type { LeadPriority, LeadSource } from "@/types/enums";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_DOT: Record<LeadStage, string> = {
  raw: "bg-muted-foreground",
  prospect: "bg-info",
  client: "bg-success",
  lost: "bg-danger",
};

interface BoardFilters {
  search: string;
  priority?: LeadPriority;
  source?: LeadSource;
}

/**
 * Four columns — the stages staff talk about — not the six raw statuses. The three
 * raw statuses collapse into one column because "new vs contacted" is a detail of
 * working a lead, not a place it sits.
 */
export function LeadPipelineBoard({ search, priority, source }: BoardFilters) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGE_PIPELINE.map((stage) => (
        <PipelineColumn
          key={stage}
          stage={stage}
          search={search}
          priority={priority}
          source={source}
          onOpen={(id) => navigate(`/leads/${id}`)}
        />
      ))}
    </div>
  );
}

function PipelineColumn({
  stage,
  search,
  priority,
  source,
  onOpen,
}: BoardFilters & { stage: LeadStage; onOpen: (id: string) => void }) {
  const statuses = STATUSES_BY_STAGE[stage];
  const { data, isLoading } = useLeads({
    // One status goes on `status`; the raw column's three go on `statuses`.
    status: statuses.length === 1 ? statuses[0] : undefined,
    statuses: statuses.length > 1 ? statuses.join(",") : undefined,
    search: search || undefined,
    priority,
    source,
    limit: 50,
  });

  return (
    <div className="w-[280px] shrink-0 rounded-xl border border-border bg-muted/30 p-2.5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cn("h-1.5 w-1.5 rounded-full", COLUMN_DOT[stage])} />
        <span className="text-[13px] font-medium text-foreground">{STAGE_LABELS[stage]}</span>
        <span className="ml-auto rounded-md bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
          {data?.total ?? "—"}
        </span>
      </div>

      <div className="space-y-2">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[72px] w-full rounded-lg" />)}

        {data?.items.map((lead) => (
          <motion.button
            key={lead.id}
            type="button"
            layoutId={`lead-card-${lead.id}`}
            onClick={() => onOpen(lead.id)}
            whileHover={{ y: -1 }}
            className="w-full rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="truncate text-[13px] font-medium text-foreground">
              {lead.first_name} {lead.last_name ?? ""}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="truncate">{lead.phone}</span>
            </div>
            {lead.email && (
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.interested_country && (
              <div className="mt-1.5 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
                {lead.interested_country}
              </div>
            )}
          </motion.button>
        ))}

        {!isLoading && data?.items.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nobody here</p>
        )}
      </div>
    </div>
  );
}
