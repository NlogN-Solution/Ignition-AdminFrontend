import { useMemo } from "react";
import { CalendarDays, CheckSquare, Clock } from "lucide-react";
import { useAuthStore } from "@/services/authStore";
import { useAppointments } from "@/modules/appointments/hooks";
import { useTasks } from "@/modules/tasks/hooks";
import { TaskStatus } from "@/types/enums";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function GreetingHeader() {
  const user = useAuthStore((s) => s.user);
  const now = useMemo(() => new Date(), []);

  const { data: appointments } = useAppointments({ limit: 100 });
  const { data: tasks } = useTasks({ status: TaskStatus.PENDING, limit: 1 });

  const todayCount = useMemo(() => {
    if (!appointments) return 0;
    const todayKey = now.toDateString();
    return appointments.items.filter((a) => a.start_time && new Date(a.start_time).toDateString() === todayKey).length;
  }, [appointments, now]);

  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          {greeting(now.getHours())}, {user?.first_name ?? "there"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <CalendarDays className="h-3.5 w-3.5 text-info" />
          <span className="text-sm font-medium tabular-nums text-foreground">{todayCount}</span>
          <span className="text-xs text-muted-foreground">today</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <CheckSquare className="h-3.5 w-3.5 text-warning" />
          <span className="text-sm font-medium tabular-nums text-foreground">{tasks?.total ?? 0}</span>
          <span className="text-xs text-muted-foreground">tasks open</span>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}
