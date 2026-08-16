import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAppointments } from "./hooks";
import type { AppointmentRead } from "./types";
import { cn } from "@/lib/utils";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function AppointmentWeekView({ onSelectAppointment }: { onSelectAppointment: (appointment: AppointmentRead) => void }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekStart = startOfWeek(anchor);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)),
    [weekStart],
  );

  const { data, isLoading } = useAppointments({ limit: 100 });

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentRead[]>();
    if (!data) return map;
    for (const day of days) {
      map.set(day.toDateString(), []);
    }
    for (const appt of data.items) {
      // Requested appointments have no start_time yet — bucket them by the
      // student's preferred date instead, so they aren't silently dropped.
      const dateValue = appt.start_time ?? appt.preferred_date;
      if (!dateValue) continue;
      const key = new Date(dateValue).toDateString();
      if (map.has(key)) map.get(key)!.push(appt);
    }
    for (const [, items] of map) {
      items.sort((a, b) => new Date(a.start_time ?? a.preferred_date ?? 0).getTime() - new Date(b.start_time ?? b.preferred_date ?? 0).getTime());
    }
    return map;
  }, [data, days]);

  const today = new Date().toDateString();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })} –{" "}
          {days[6].toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setAnchor(new Date(weekStart.getTime() - 7 * 86400000))}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setAnchor(new Date(weekStart.getTime() + 7 * 86400000))}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const items = byDay.get(day.toDateString()) ?? [];
          const isToday = day.toDateString() === today;
          return (
            <div key={day.toISOString()} className={cn("min-h-[220px] rounded-xl border border-border p-2", isToday && "border-primary/40 bg-primary/[0.03]")}>
              <p className={cn("mb-2 text-center text-[11px] font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                {day.toLocaleDateString(undefined, { weekday: "short" })}
                <span className="ml-1 tabular-nums">{day.getDate()}</span>
              </p>
              <div className="space-y-1.5">
                {isLoading && <Skeleton className="h-14 w-full" />}
                {items.map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => onSelectAppointment(appt)}
                    className="w-full rounded-lg border border-border bg-card p-2 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="truncate text-[11.5px] font-medium text-foreground">{appt.title}</p>
                    <p className="text-[10.5px] tabular-nums text-muted-foreground">
                      {appt.start_time
                        ? new Date(appt.start_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
                        : "Time TBD"}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                      {appt.meeting_link ? <Video className="h-2.5 w-2.5" /> : appt.location ? <MapPin className="h-2.5 w-2.5" /> : null}
                      <StatusBadge status={appt.status} className="px-1 py-0 text-[9.5px]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
