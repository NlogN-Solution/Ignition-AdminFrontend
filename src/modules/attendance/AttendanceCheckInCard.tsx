import { useEffect, useState } from "react";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCheckIn, useCheckOut, useTodayAttendance } from "./hooks";
import { formatDuration } from "@/utils/format";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function AttendanceCheckInCard() {
  const { data: today, isLoading } = useTodayAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [now, setNow] = useState(() => Date.now());

  const isCheckedIn = Boolean(today?.check_in_at) && !today?.check_out_at;

  useEffect(() => {
    if (!isCheckedIn) return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const liveWorkedSeconds =
    isCheckedIn && today?.check_in_at ? Math.floor((now - new Date(today.check_in_at).getTime()) / 1000) : today?.worked_seconds;

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[13px] font-semibold text-foreground">Today</p>
          {!today ? (
            <p className="text-sm text-muted-foreground">You haven't checked in yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5" /> {formatTime(today.check_in_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> {formatTime(today.check_out_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" /> Worked {formatDuration(liveWorkedSeconds)}
              </span>
              <StatusBadge status={today.status} />
            </div>
          )}
        </div>

        <div>
          {!today ? (
            <Button disabled={checkIn.isPending} onClick={() => checkIn.mutate()}>
              <LogIn className="h-3.5 w-3.5" /> Check in
            </Button>
          ) : !today.check_out_at ? (
            <Button variant="outline" disabled={checkOut.isPending} onClick={() => checkOut.mutate()}>
              <LogOut className="h-3.5 w-3.5" /> Check out
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Done for today</span>
          )}
        </div>
      </div>
    </div>
  );
}
