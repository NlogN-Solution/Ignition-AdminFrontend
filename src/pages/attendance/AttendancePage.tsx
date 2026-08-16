import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarCheck, Clock3, Settings, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/services/authStore";
import { AttendanceCheckInCard } from "@/modules/attendance/AttendanceCheckInCard";
import { AttendancePolicyDialog } from "@/modules/attendance/AttendancePolicyDialog";
import { AttendanceRecordDialog } from "@/modules/attendance/AttendanceRecordDialog";
import { useAttendanceDashboard, useAttendanceList } from "@/modules/attendance/hooks";
import { useDepartments } from "@/modules/people/hooks";
import type { AttendanceRecord } from "@/modules/attendance/types";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { AttendanceStatus, UserRole } from "@/types/enums";
import { formatDate, formatDateTime, formatDuration, toTitleCase } from "@/utils/format";

function canManageAttendance(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AttendancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = canManageAttendance(role);

  const [dashboardDate, setDashboardDate] = useState(todayIso());
  const { data: dashboard, isLoading: dashboardLoading } = useAttendanceDashboard(canManage ? dashboardDate : undefined);
  const [policyOpen, setPolicyOpen] = useState(false);

  const [departmentId, setDepartmentId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const { data: departments } = useDepartments({ limit: 100 });

  const listParams = useMemo(
    () => ({
      page,
      limit: 20,
      department_id: departmentId === "all" ? undefined : departmentId,
      status: status === "all" ? undefined : (status as AttendanceStatus),
      date_from: dashboardDate,
      date_to: dashboardDate,
    }),
    [page, departmentId, status, dashboardDate],
  );
  const { data, isLoading } = useAttendanceList(canManage ? listParams : { page: 1, limit: 1 });

  const columns = useMemo<ColumnDef<AttendanceRecord, any>[]>(
    () => [
      { accessorKey: "user_id", header: "Employee", cell: ({ getValue }) => <StaffDirectoryNameCell userId={getValue<string>()} /> },
      { accessorKey: "date", header: "Date", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { accessorKey: "check_in_at", header: "Check in", cell: ({ getValue }) => formatDateTime(getValue<string | null>()) },
      { accessorKey: "check_out_at", header: "Check out", cell: ({ getValue }) => formatDateTime(getValue<string | null>()) },
      {
        accessorKey: "worked_seconds",
        header: "Worked",
        cell: ({ getValue }) => <span className="tabular-nums">{formatDuration(getValue<number | null>())}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        id: "actions",
        header: "",
        size: 48,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={canManage ? "Team check-ins, today's status, and attendance history." : "Your check-in history and today's status."}
        actions={
          canManage ? (
            <Button variant="outline" size="sm" onClick={() => setPolicyOpen(true)}>
              <Settings className="h-3.5 w-3.5" /> Policy
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5">
        <AttendanceCheckInCard />
      </div>

      {canManage && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Present" value={dashboard?.present ?? 0} icon={UserCheck} accent="success" />
              <StatCard label="Late" value={dashboard?.late ?? 0} icon={Clock3} accent="warning" />
              <StatCard label="Currently working" value={dashboard?.currently_working ?? 0} icon={CalendarCheck} accent="info" />
              <StatCard label="Absent" value={dashboard?.absent ?? 0} icon={UserX} accent="danger" />
            </div>
            <Input
              type="date"
              value={dashboardDate}
              onChange={(e) => {
                setDashboardDate(e.target.value);
                setPage(1);
              }}
              className="h-9 w-[160px]"
            />
          </div>
          {!dashboardLoading && dashboard && !dashboard.is_work_day && (
            <p className="mb-3 text-xs text-muted-foreground">This date isn't a work day per the attendance policy.</p>
          )}

          <div className="mb-3">
            <ListToolbar
              filters={
                <>
                  <Select
                    value={departmentId}
                    onValueChange={(v) => {
                      setDepartmentId(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger size="sm" className="h-8 w-[170px] text-xs">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {(departments?.items ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {[AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.HALF_DAY, AttendanceStatus.ON_LEAVE, AttendanceStatus.HOLIDAY].map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            {toTitleCase(s)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </div>

          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            getRowId={(row) => row.id}
            page={page}
            limit={20}
            total={data?.total}
            onPageChange={setPage}
            emptyState={
              <EmptyState icon={CalendarCheck} title="No attendance records for this date" description="Check-ins will show up here." className="border-none py-16" />
            }
          />
        </>
      )}

      <AttendancePolicyDialog open={policyOpen} onOpenChange={setPolicyOpen} />
      <AttendanceRecordDialog record={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
