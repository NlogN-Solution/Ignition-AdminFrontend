import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPicker } from "@/components/shared/UserPicker";
import { useAuthStore } from "@/services/authStore";
import { AppointmentType, UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useCreateAppointment } from "./hooks";

function defaultTimes() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setMinutes(30);
  const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { start: toLocal(start), end: toLocal(end) };
}

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  defaultStudentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentId?: string;
}) {
  const role = useAuthStore((s) => s.user?.role);
  const isStudent = role === UserRole.STUDENT;
  const createAppointment = useCreateAppointment();
  const [studentId, setStudentId] = useState<string | undefined>(defaultStudentId);
  const [counsellorId, setCounsellorId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(AppointmentType.CONSULTATION);
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [times, setTimes] = useState(defaultTimes());
  const [preferredDate, setPreferredDate] = useState(defaultDate());

  useEffect(() => {
    if (open) {
      setStudentId(defaultStudentId);
      setCounsellorId(undefined);
      setTitle("");
      setType(AppointmentType.CONSULTATION);
      setLocation("");
      setMeetingLink("");
      setNotes("");
      setTimes(defaultTimes());
      setPreferredDate(defaultDate());
    }
  }, [open, defaultStudentId]);

  const canSubmit = isStudent ? Boolean(title && type && preferredDate) : Boolean(studentId && title && times.start && times.end);

  function handleSubmit() {
    if (isStudent) {
      createAppointment.mutate(
        {
          appointment_type: type as AppointmentType,
          title,
          preferred_date: preferredDate,
          notes: notes || undefined,
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    if (!studentId) return;
    createAppointment.mutate(
      {
        student_id: studentId,
        counsellor_id: counsellorId,
        appointment_type: type as AppointmentType,
        title,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isStudent ? "Request an appointment" : "Book appointment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Visa consultation" />
          </div>

          {!isStudent && (
            <div className="space-y-1.5">
              <Label>Applicant</Label>
              <UserPicker value={studentId} onChange={setStudentId} role={UserRole.STUDENT} placeholder="Select applicant…" disabled={Boolean(defaultStudentId)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AppointmentType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isStudent ? (
              <div className="space-y-1.5">
                <Label>Preferred date</Label>
                <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Counsellor</Label>
                <UserPicker value={counsellorId} onChange={setCounsellorId} role={UserRole.COUNSELLOR} placeholder="Assign…" />
              </div>
            )}
          </div>

          {!isStudent && (
            <>
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
            </>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isStudent ? "Anything your counsellor should know before you meet…" : undefined}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || createAppointment.isPending} onClick={handleSubmit}>
            {createAppointment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isStudent ? "Request appointment" : "Book appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
