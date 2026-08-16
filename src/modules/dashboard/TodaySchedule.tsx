import { useMemo } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, CheckSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments } from "@/modules/appointments/hooks";
import { useTasks } from "@/modules/tasks/hooks";
import { TaskStatus } from "@/types/enums";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  time: Date;
  title: string;
  type: "appointment" | "task";
  meta?: string;
}

export function TodaySchedule() {
  const navigate = useNavigate();
  const { data: appointments, isLoading: apptLoading } = useAppointments({ limit: 100 });
  const { data: tasks, isLoading: taskLoading } = useTasks({ status: TaskStatus.PENDING, limit: 50 });

  const items = useMemo<ScheduleItem[]>(() => {
    const todayKey = new Date().toDateString();
    const fromAppointments: ScheduleItem[] = (appointments?.items ?? [])
      .filter((a) => a.start_time && new Date(a.start_time).toDateString() === todayKey)
      .map((a) => ({ id: a.id, time: new Date(a.start_time!), title: a.title, type: "appointment", meta: a.location ?? undefined }));

    const fromTasks: ScheduleItem[] = (tasks?.items ?? [])
      .filter((t) => t.due_date && new Date(t.due_date).toDateString() === todayKey)
      .map((t) => ({ id: t.id, time: new Date(t.due_date!), title: t.title, type: "task" }));

    return [...fromAppointments, ...fromTasks].sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [appointments, tasks]);

  const isLoading = apptLoading || taskLoading;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Today's schedule</h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled today" description="Appointments and task deadlines for today will show up here." className="border-none py-8" />
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <button
                onClick={() => navigate(item.type === "appointment" ? "/appointments" : "/tasks")}
                className="flex w-full items-center gap-3 rounded-lg text-left transition-colors hover:bg-muted/40"
              >
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {item.time.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", item.type === "appointment" ? "bg-info/10 text-info" : "bg-warning/10 text-warning")}>
                  {item.type === "appointment" ? <CalendarDays className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{item.title}</span>
                {item.meta && <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
