import { useMemo } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CalendarClock, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDueFollowUps } from "@/modules/leads/hooks";
import { cn } from "@/lib/utils";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function FollowUpReminders() {
  const navigate = useNavigate();
  const { data, isLoading } = useDueFollowUps({ limit: 100 });

  const buckets = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today.getTime() + 86400000);
    const dayAfter = new Date(today.getTime() + 2 * 86400000);

    const overdue = [];
    const dueToday = [];
    const dueTomorrow = [];

    for (const item of data?.items ?? []) {
      const scheduled = new Date(item.scheduled_at);
      if (scheduled < today) overdue.push(item);
      else if (scheduled < tomorrow) dueToday.push(item);
      else if (scheduled < dayAfter) dueTomorrow.push(item);
    }

    return { overdue, dueToday, dueTomorrow };
  }, [data]);

  const hotOverdue = buckets.overdue.filter((i) => i.lead_priority === "hot");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const total = buckets.overdue.length + buckets.dueToday.length + buckets.dueTomorrow.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-[13px] font-medium text-foreground">Follow-up reminders</p>

      {total === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing due" description="All follow-ups are on track." className="border-none py-8" />
      ) : (
        <div className="space-y-2">
          {hotOverdue.length > 0 && (
            <button
              onClick={() => navigate("/leads?priority=hot")}
              className="flex w-full items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-left text-danger"
            >
              <Flame className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">
                {hotOverdue.length} hot lead{hotOverdue.length === 1 ? "" : "s"} overdue for follow-up
              </span>
            </button>
          )}

          <ReminderRow icon={AlertTriangle} label="Overdue" count={buckets.overdue.length} tone="danger" onClick={() => navigate("/leads")} />
          <ReminderRow icon={CalendarClock} label="Due today" count={buckets.dueToday.length} tone="warning" onClick={() => navigate("/leads")} />
          <ReminderRow icon={CalendarClock} label="Due tomorrow" count={buckets.dueTomorrow.length} tone="info" onClick={() => navigate("/leads")} />
        </div>
      )}
    </div>
  );
}

function ReminderRow({
  icon: Icon,
  label,
  count,
  tone,
  onClick,
}: {
  icon: typeof AlertTriangle;
  label: string;
  count: number;
  tone: "danger" | "warning" | "info";
  onClick: () => void;
}) {
  if (count === 0) return null;
  const toneClass = { danger: "text-danger bg-danger/10", warning: "text-warning bg-warning/10", info: "text-info bg-info/10" }[tone];
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/40">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", toneClass)}>
          <Icon className="h-3 w-3" />
        </span>
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums text-foreground">{count}</span>
    </button>
  );
}
