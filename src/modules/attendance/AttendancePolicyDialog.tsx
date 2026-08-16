import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAttendancePolicy, useUpdateAttendancePolicy } from "./hooks";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AttendancePolicyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: policy } = useAttendancePolicy();
  const update = useUpdateAttendancePolicy();

  const [workDays, setWorkDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [gracePeriod, setGracePeriod] = useState("10");
  const [breakMinutes, setBreakMinutes] = useState("60");

  useEffect(() => {
    if (open) {
      setWorkDays(policy?.work_days ?? [0, 1, 2, 3, 4]);
      setStartTime(policy?.expected_start_time?.slice(0, 5) ?? "09:00");
      setEndTime(policy?.expected_end_time?.slice(0, 5) ?? "17:00");
      setGracePeriod(String(policy?.grace_period_minutes ?? 10));
      setBreakMinutes(String(policy?.break_minutes ?? 60));
    }
  }, [open, policy]);

  function toggleDay(day: number) {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function handleSave() {
    update.mutate(
      {
        work_days: workDays,
        expected_start_time: `${startTime}:00`,
        expected_end_time: `${endTime}:00`,
        grace_period_minutes: Number(gracePeriod) || 0,
        break_minutes: Number(breakMinutes) || 0,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Attendance policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Work days</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-xs font-medium transition-colors",
                    workDays.includes(day)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expected start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expected end</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Grace period (min)</Label>
              <Input type="number" min={0} value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Break (min)</Label>
              <Input type="number" min={0} value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={workDays.length === 0 || update.isPending} onClick={handleSave}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
