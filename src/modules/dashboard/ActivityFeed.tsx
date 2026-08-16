import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Activity, CalendarDays, CheckSquare, FileText, UserPlus, Wallet } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/modules/leads/hooks";
import { useApplications } from "@/modules/applications/hooks";
import { usePayments } from "@/modules/payments/hooks";
import { useAppointments } from "@/modules/appointments/hooks";
import { useTasks } from "@/modules/tasks/hooks";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

interface FeedItem {
  id: string;
  icon: typeof UserPlus;
  tone: string;
  title: string;
  time: string;
  path: string;
}

export function ActivityFeed() {
  const navigate = useNavigate();
  const { data: leads, isLoading: l1 } = useLeads({ limit: 5 });
  const { data: applications, isLoading: l2 } = useApplications({ limit: 5 });
  const { data: payments, isLoading: l3 } = usePayments({ limit: 5 });
  const { data: appointments, isLoading: l4 } = useAppointments({ limit: 5 });
  const { data: tasks, isLoading: l5 } = useTasks({ limit: 5 });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const items = useMemo<FeedItem[]>(() => {
    const all: FeedItem[] = [
      ...(leads?.items ?? []).map((l) => ({
        id: `lead-${l.id}`,
        icon: UserPlus,
        tone: "text-info bg-info/10",
        title: `New lead: ${l.first_name} ${l.last_name ?? ""}`,
        time: l.created_at,
        path: `/leads/${l.id}`,
      })),
      ...(applications?.items ?? []).map((a) => ({
        id: `app-${a.id}`,
        icon: FileText,
        tone: "text-primary bg-primary/10",
        title: "Application created",
        time: a.created_at,
        path: `/applications/${a.id}`,
      })),
      ...(payments?.items ?? []).map((p) => ({
        id: `pay-${p.id}`,
        icon: Wallet,
        tone: "text-success bg-success/10",
        title: `Payment of ${formatCurrency(p.amount, p.currency)} recorded`,
        time: p.created_at,
        path: "/payments",
      })),
      ...(appointments?.items ?? []).map((a) => ({
        id: `appt-${a.id}`,
        icon: CalendarDays,
        tone: "text-warning bg-warning/10",
        title: `Appointment booked: ${a.title}`,
        time: a.created_at,
        path: "/appointments",
      })),
      ...(tasks?.items ?? []).map((t) => ({
        id: `task-${t.id}`,
        icon: CheckSquare,
        tone: "text-muted-foreground bg-muted",
        title: `Task: ${t.title}`,
        time: t.created_at,
        path: "/tasks",
      })),
    ];
    return all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  }, [leads, applications, payments, appointments, tasks]);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Recent activity</h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Actions across your workspace will show up here." className="border-none py-8" />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button onClick={() => navigate(item.path)} className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted/40">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", item.tone)}>
                  <item.icon className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{item.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(item.time)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
