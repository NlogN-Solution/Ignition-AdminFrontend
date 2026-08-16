import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppointments } from "@/modules/appointments/hooks";
import { AppointmentDetailSheet } from "@/modules/appointments/AppointmentDetailSheet";
import { AppointmentFormDialog } from "@/modules/appointments/AppointmentFormDialog";
import { AppointmentWeekView } from "@/modules/appointments/AppointmentWeekView";
import type { AppointmentRead } from "@/modules/appointments/types";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { useAuthStore } from "@/services/authStore";
import { AppointmentStatus, AppointmentType, UserRole } from "@/types/enums";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { formatDateTime, toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";

export function AppointmentsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isStudent = role === UserRole.STUDENT;

  const [view, setView] = useState<"table" | "week">("week");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();
  const [detailId, setDetailId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : (status as AppointmentStatus),
      appointment_type: type === "all" ? undefined : (type as AppointmentType),
    }),
    [page, debouncedSearch, status, type],
  );
  const { data, isLoading } = useAppointments(params);

  const columns = useMemo<ColumnDef<AppointmentRead, any>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      ...(isStudent
        ? []
        : [
            {
              accessorKey: "student_id",
              header: "Applicant",
              cell: ({ getValue }: { getValue: () => string }) => <StudentNameCell userId={getValue()} />,
            } as ColumnDef<AppointmentRead, any>,
          ]),
      {
        accessorKey: "appointment_type",
        header: "Type",
        cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      { accessorKey: "start_time", header: "Starts", cell: ({ getValue }) => formatDateTime(getValue<string | null>()) },
      { accessorKey: "location", header: "Location", cell: ({ getValue }) => getValue<string>() || "—" },
    ],
    [isStudent],
  );

  return (
    <div>
      <PageHeader
        title={isStudent ? "My appointments" : "Appointments"}
        description={isStudent ? "Request time with your assigned counsellor." : "Consultations, visa reviews, and follow-up calls."}
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setView("week")}
                className={cn("rounded-md p-1.5", view === "week" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={cn("rounded-md p-1.5", view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {isStudent ? "Request an appointment" : "Book appointment"}
            </Button>
          </>
        }
      />

      {view === "table" && (
        <div className="mb-3">
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by title or location…"
            filters={
              <>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(AppointmentStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {toTitleCase(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger size="sm" className="h-8 w-[160px] text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(AppointmentType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {toTitleCase(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </div>
      )}

      {view === "table" ? (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => setDetailId(row.id)}
          page={page}
          limit={20}
          total={data?.total}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={CalendarDays}
              title="No appointments scheduled"
              description={isStudent ? "Request a consultation or follow-up to get started." : "Book a consultation, call, or office visit to get started."}
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> {isStudent ? "Request an appointment" : "Book appointment"}
                </Button>
              }
              className="border-none py-20"
            />
          }
        />
      ) : (
        <AppointmentWeekView onSelectAppointment={(appt) => setDetailId(appt.id)} />
      )}

      <AppointmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <AppointmentDetailSheet appointmentId={detailId} onOpenChange={(open) => !open && setDetailId(null)} />
    </div>
  );
}
