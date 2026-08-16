import { useMemo } from "react";
import { motion } from "motion/react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, useUpdateTask } from "./hooks";
import { TASK_STATUS_COLUMNS, type TaskRead } from "./types";
import { TaskStatus } from "@/types/enums";
import { toneForStatus } from "@/utils/statusTone";
import { toTitleCase, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

const DOT: Record<string, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-info",
  high: "text-warning",
  urgent: "text-danger",
};

function nextStatus(status: string): TaskStatus | null {
  const idx = TASK_STATUS_COLUMNS.indexOf(status as TaskStatus);
  if (idx === -1 || idx >= TASK_STATUS_COLUMNS.length - 2) return null; // don't auto-advance into cancelled
  return TASK_STATUS_COLUMNS[idx + 1];
}

export function TaskBoard({ search }: { search: string }) {
  const { data, isLoading } = useTasks({ limit: 100, search: search || undefined });
  const updateTask = useUpdateTask();

  const byStatus = useMemo(() => {
    const map = new Map<string, TaskRead[]>(TASK_STATUS_COLUMNS.map((s) => [s, []]));
    for (const task of data?.items ?? []) {
      if (!map.has(task.status)) map.set(task.status, []);
      map.get(task.status)!.push(task);
    }
    return map;
  }, [data]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {TASK_STATUS_COLUMNS.map((status) => {
        const items = byStatus.get(status) ?? [];
        const tone = toneForStatus(status);
        return (
          <div key={status} className="w-[280px] shrink-0 rounded-xl border border-border bg-muted/30 p-2.5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} />
              <span className="text-[13px] font-medium text-foreground">{toTitleCase(status)}</span>
              <span className="ml-auto rounded-md bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {isLoading ? "—" : items.length}
              </span>
            </div>

            <div className="space-y-2">
              {isLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-lg" />)}

              {items.map((task) => {
                const advance = nextStatus(task.status);
                return (
                  <motion.div key={task.id} layout className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
                    <p className="text-[13px] font-medium text-foreground">{task.title}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={cn("text-[11px] font-medium", PRIORITY_CLASS[task.priority])}>{toTitleCase(task.priority)}</span>
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                          <CalendarClock className="h-2.5 w-2.5" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                    {advance && (
                      <button
                        type="button"
                        onClick={() =>
                          updateTask.mutate({
                            id: task.id,
                            payload: {
                              status: advance,
                              completed_at: advance === TaskStatus.COMPLETED ? new Date().toISOString() : undefined,
                            },
                          })
                        }
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-border py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Move to {toTitleCase(advance)} <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                );
              })}

              {!isLoading && items.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted-foreground">No tasks</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
