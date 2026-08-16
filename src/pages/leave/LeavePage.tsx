import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Check, Plus, Settings, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/services/authStore";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import {
  useApproveLeaveRequest,
  useCancelLeaveRequest,
  useLeaveBalance,
  useLeaveRequests,
  useLeaveTypes,
  useRejectLeaveRequest,
} from "@/modules/leave/hooks";
import { LeaveRequestDialog } from "@/modules/leave/LeaveRequestDialog";
import { LeaveTypesDialog } from "@/modules/leave/LeaveTypesDialog";
import type { LeaveRequest } from "@/modules/leave/types";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { LeaveStatus, UserRole } from "@/types/enums";
import { formatDate, toTitleCase } from "@/utils/format";

function canManageLeave(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER;
}

function LeaveRowActions({ request, isSelf }: { request: LeaveRequest; isSelf: boolean }) {
  const approve = useApproveLeaveRequest();
  const reject = useRejectLeaveRequest();
  const cancel = useCancelLeaveRequest();
  const role = useAuthStore((s) => s.user?.role);
  const canManage = canManageLeave(role);

  if (request.status !== LeaveStatus.PENDING && !(request.status === LeaveStatus.APPROVED && isSelf)) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {canManage && request.status === LeaveStatus.PENDING && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-success hover:text-success"
            disabled={approve.isPending}
            onClick={() => approve.mutate({ id: request.id })}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-danger hover:text-danger"
            disabled={reject.isPending}
            onClick={() => {
              const reason = prompt("Reason for rejecting this request?");
              if (reason) reject.mutate({ id: request.id, reason });
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
      {isSelf && (request.status === LeaveStatus.PENDING || request.status === LeaveStatus.APPROVED) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          disabled={cancel.isPending}
          onClick={() => {
            if (confirm("Cancel this leave request?")) cancel.mutate(request.id);
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

export function LeavePage() {
  const currentUser = useAuthStore((s) => s.user);
  const canManage = canManageLeave(currentUser?.role);

  const [requestOpen, setRequestOpen] = useQueryFlagDialog();
  const [typesOpen, setTypesOpen] = useState(false);

  const { data: balance } = useLeaveBalance(currentUser?.id);
  const { data: myRequests, isLoading: myLoading } = useLeaveRequests({ user_id: currentUser?.id, limit: 10 });

  const [status, setStatus] = useState<string>(LeaveStatus.PENDING);
  const [leaveTypeId, setLeaveTypeId] = useState("all");
  const [page, setPage] = useState(1);
  const { data: leaveTypes } = useLeaveTypes();

  const adminParams = useMemo(
    () => ({
      page,
      limit: 20,
      status: status === "all" ? undefined : (status as LeaveStatus),
      leave_type_id: leaveTypeId === "all" ? undefined : leaveTypeId,
    }),
    [page, status, leaveTypeId],
  );
  const { data: allRequests, isLoading: allLoading } = useLeaveRequests(canManage ? adminParams : { page: 1, limit: 1 });

  const typeName = useCallback((id: string): string => leaveTypes?.items.find((t) => t.id === id)?.name ?? "—", [leaveTypes]);

  const myColumns = useMemo<ColumnDef<LeaveRequest, any>[]>(
    () => [
      { accessorKey: "leave_type_id", header: "Type", cell: ({ getValue }) => typeName(getValue<string>()) },
      { accessorKey: "start_date", header: "From", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { accessorKey: "end_date", header: "To", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { accessorKey: "requested_days", header: "Days", cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <LeaveRowActions request={row.original} isSelf />,
      },
    ],
    [typeName],
  );

  const adminColumns = useMemo<ColumnDef<LeaveRequest, any>[]>(
    () => [
      { accessorKey: "user_id", header: "Employee", cell: ({ getValue }) => <StaffDirectoryNameCell userId={getValue<string>()} /> },
      { accessorKey: "leave_type_id", header: "Type", cell: ({ getValue }) => typeName(getValue<string>()) },
      { accessorKey: "start_date", header: "From", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { accessorKey: "end_date", header: "To", cell: ({ getValue }) => formatDate(getValue<string>()) },
      { accessorKey: "requested_days", header: "Days", cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <LeaveRowActions request={row.original} isSelf={row.original.user_id === currentUser?.id} />,
      },
    ],
    [currentUser?.id, typeName],
  );

  return (
    <div>
      <PageHeader
        title="Leave"
        description={canManage ? "Team leave requests, approvals, and balances." : "Your leave balance and requests."}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setTypesOpen(true)}>
                <Settings className="h-3.5 w-3.5" /> Leave types
              </Button>
            )}
            <Button size="sm" onClick={() => setRequestOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Request leave
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(balance?.items ?? []).map((entry) => (
          <StatCard key={entry.leave_type_id} label={entry.leave_type_name} value={entry.remaining_days} icon={CalendarClock} accent="info" />
        ))}
      </div>

      <div className="mb-8">
        <p className="mb-3 text-[13px] font-semibold text-foreground">My requests</p>
        <DataTable
          columns={myColumns}
          data={myRequests?.items ?? []}
          isLoading={myLoading}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={CalendarClock}
              title="No leave requests yet"
              action={
                <Button size="sm" onClick={() => setRequestOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Request leave
                </Button>
              }
              className="border-none py-14"
            />
          }
        />
      </div>

      {canManage && (
        <div>
          <p className="mb-3 text-[13px] font-semibold text-foreground">Team requests</p>
          <div className="mb-3">
            <ListToolbar
              filters={
                <>
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
                      {Object.values(LeaveStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {toTitleCase(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={leaveTypeId}
                    onValueChange={(v) => {
                      setLeaveTypeId(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger size="sm" className="h-8 w-[160px] text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {(leaveTypes?.items ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </div>

          <DataTable
            columns={adminColumns}
            data={allRequests?.items ?? []}
            isLoading={allLoading}
            getRowId={(row) => row.id}
            page={page}
            limit={20}
            total={allRequests?.total}
            onPageChange={setPage}
            emptyState={<EmptyState icon={CalendarClock} title="No requests match your filters" className="border-none py-14" />}
          />
        </div>
      )}

      <LeaveRequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <LeaveTypesDialog open={typesOpen} onOpenChange={setTypesOpen} />
    </div>
  );
}
