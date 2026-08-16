import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { useUpdateAttendanceRecord } from "./hooks";
import { AttendanceStatus } from "@/types/enums";
import { formatDate, toTitleCase } from "@/utils/format";
import type { AttendanceRecord } from "./types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AttendanceRecordDialog({
  record,
  onOpenChange,
}: {
  record: AttendanceRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateAttendanceRecord();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState<string>(AttendanceStatus.PRESENT);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (record) {
      setCheckIn(toLocalInput(record.check_in_at));
      setCheckOut(toLocalInput(record.check_out_at));
      setStatus(record.status);
      setNotes(record.notes ?? "");
    }
  }, [record]);

  if (!record) return null;

  function handleSave() {
    if (!record) return;
    update.mutate(
      {
        id: record.id,
        payload: {
          check_in_at: checkIn ? new Date(checkIn).toISOString() : undefined,
          check_out_at: checkOut ? new Date(checkOut).toISOString() : undefined,
          status: status as AttendanceStatus,
          notes: notes || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Correct attendance record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[13px]">
            <p className="font-medium text-foreground">
              <StaffDirectoryNameCell userId={record.user_id} />
            </p>
            <p className="text-muted-foreground">{formatDate(record.date)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check in</Label>
              <Input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Check out</Label>
              <Input type="datetime-local" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AttendanceStatus)
                  .filter((s) => s !== AttendanceStatus.WEEKEND && s !== AttendanceStatus.ABSENT)
                  .map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={handleSave}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
