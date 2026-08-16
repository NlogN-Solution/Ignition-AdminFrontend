import { useState } from "react";
import { Calendar, Clock, Loader2, MapPin, MessageSquare, Trash2, Users, Video } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { useAuthStore } from "@/services/authStore";
import { AppointmentStatus, UserRole } from "@/types/enums";
import { formatDate, formatDateTime, toTitleCase } from "@/utils/format";
import { AppointmentConfirmDialog } from "./AppointmentConfirmDialog";
import { useAppointment, useDeleteAppointment } from "./hooks";

// Same set allowed to confirm a request may also delete the appointment.
function canManage(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.COUNSELLOR;
}

export function AppointmentDetailSheet({
  appointmentId,
  onOpenChange,
}: {
  appointmentId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const role = useAuthStore((s) => s.user?.role);
  const [confirming, setConfirming] = useState(false);
  // Fetched live by id (rather than passed as a static row snapshot) so the
  // sheet reflects the counsellor's changes immediately after they confirm.
  const { data: appointment, isLoading } = useAppointment(appointmentId ?? undefined);
  const deleteAppointment = useDeleteAppointment();

  if (!appointmentId) return null;

  if (isLoading || !appointment) {
    return (
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Appointment</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const isRequested = appointment.status === AppointmentStatus.REQUESTED;

  return (
    <>
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle>{appointment.title}</SheetTitle>
              <StatusBadge status={appointment.status} />
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field icon={Calendar} label="Type" value={toTitleCase(appointment.appointment_type)} />
              <Field label="Applicant" value={<StudentNameCell userId={appointment.student_id} />} />
              <Field label="Counsellor" value={<StaffDirectoryNameCell userId={appointment.counsellor_id} />} />
              {isRequested ? (
                <Field icon={Clock} label="Preferred date" value={formatDate(appointment.preferred_date)} />
              ) : (
                <>
                  <Field icon={Clock} label="Starts" value={formatDateTime(appointment.start_time)} />
                  <Field icon={Clock} label="Ends" value={formatDateTime(appointment.end_time)} />
                </>
              )}
              {!isRequested && appointment.location && <Field icon={MapPin} label="Location" value={appointment.location} />}
              {!isRequested && appointment.meeting_link && (
                <Field
                  icon={Video}
                  label="Meeting link"
                  value={
                    <a href={appointment.meeting_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Join meeting
                    </a>
                  }
                />
              )}
              {appointment.attendee_ids && appointment.attendee_ids.length > 0 && (
                <Field
                  icon={Users}
                  label="Other attendees"
                  value={
                    <span className="flex flex-wrap gap-x-1.5">
                      {appointment.attendee_ids.map((id, idx) => (
                        <span key={id}>
                          <StaffDirectoryNameCell userId={id} />
                          {idx < appointment.attendee_ids!.length - 1 && ","}
                        </span>
                      ))}
                    </span>
                  }
                />
              )}
            </div>

            {appointment.notes && (
              <div className="border-t border-border pt-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MessageSquare className="h-3 w-3" /> Notes
                </p>
                <p className="text-sm text-foreground">{appointment.notes}</p>
              </div>
            )}
          </div>

          {canManage(role) && (
            <div className="flex items-center gap-2 border-t border-border p-4">
              {isRequested && (
                <Button className="flex-1" onClick={() => setConfirming(true)}>
                  Add details
                </Button>
              )}
              <Button
                variant="outline"
                className={isRequested ? "text-danger hover:text-danger" : "flex-1 text-danger hover:text-danger"}
                disabled={deleteAppointment.isPending}
                onClick={() => {
                  if (confirm("Delete this appointment permanently?")) {
                    deleteAppointment.mutate(appointment.id, { onSuccess: () => onOpenChange(false) });
                  }
                }}
              >
                {deleteAppointment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {!isRequested && "Delete"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {confirming && <AppointmentConfirmDialog appointment={appointment} onOpenChange={setConfirming} />}
    </>
  );
}

function Field({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <div className="mt-1 text-foreground">{value}</div>
    </div>
  );
}
