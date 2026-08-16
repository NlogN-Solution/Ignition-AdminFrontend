import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { useAuthStore } from "@/services/authStore";
import { formatDate } from "@/utils/format";
import { AttendeePicker } from "./AttendeePicker";
import { useUpdateAppointment } from "./hooks";
import type { AppointmentRead } from "./types";

function defaultTimes(preferredDate: string | null) {
  const start = preferredDate ? new Date(`${preferredDate}T10:00`) : new Date();
  if (!preferredDate) {
    start.setDate(start.getDate() + 1);
    start.setMinutes(0, 0, 0);
    start.setHours(10);
  }
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { start: toLocal(start), end: toLocal(end) };
}

export function AppointmentConfirmDialog({
  appointment,
  onOpenChange,
}: {
  appointment: AppointmentRead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const update = useUpdateAppointment(appointment?.id ?? "");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [times, setTimes] = useState(defaultTimes(null));

  useEffect(() => {
    if (appointment) {
      setLocation(appointment.location ?? "");
      setMeetingLink(appointment.meeting_link ?? "");
      setNotes(appointment.notes ?? "");
      setAttendeeIds(appointment.attendee_ids ?? []);
      setTimes(defaultTimes(appointment.preferred_date));
    }
  }, [appointment]);

  if (!appointment || !currentUser) return null;

  const canSubmit = Boolean(times.start && times.end);

  function handleSubmit() {
    if (!appointment || !currentUser) return;
    update.mutate(
      {
        // The person confirming the request becomes the counsellor of record
        // — no picker, this is always self.
        counsellor_id: currentUser.id,
        attendee_ids: attendeeIds,
        start_time: new Date(times.start).toISOString(),
        end_time: new Date(times.end).toISOString(),
        location: location || undefined,
        meeting_link: meetingLink || undefined,
        notes: notes || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm appointment request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-[13px]">
            <p className="font-medium text-foreground">{appointment.title}</p>
            <p className="mt-0.5 text-muted-foreground">
              Requested by <StudentNameCell userId={appointment.student_id} />
              {appointment.preferred_date && <> for {formatDate(appointment.preferred_date)}</>}
            </p>
            {appointment.notes && <p className="mt-1.5 text-muted-foreground">"{appointment.notes}"</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Counsellor</Label>
            <p className="text-sm text-foreground">
              {currentUser.first_name} {currentUser.last_name} <span className="text-muted-foreground">(you)</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="datetime-local" value={times.start} onChange={(e) => setTimes((t) => ({ ...t, start: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="datetime-local" value={times.end} onChange={(e) => setTimes((t) => ({ ...t, end: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Office / Room 2" />
            </div>
            <div className="space-y-1.5">
              <Label>Meeting link</Label>
              <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Other attendees</Label>
            <AttendeePicker value={attendeeIds} onChange={setAttendeeIds} excludeIds={[currentUser.id]} />
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
          <Button disabled={!canSubmit || update.isPending} onClick={handleSubmit}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
