import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Banknote,
  Cake,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/services/authStore";
import { API_BASE_URL } from "@/services/apiClient";
import { useEmployeeProfile, useEmployeeProfileTimeline, useUpsertEmployeeProfile, useUser } from "@/modules/users/hooks";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { useDepartments } from "@/modules/people/hooks";
import { StaffPicker } from "@/modules/people/StaffPicker";
import { useEmployeeAttendanceSummary } from "@/modules/attendance/hooks";
import { useLeaveBalance, useLeaveRequests, useLeaveTypes } from "@/modules/leave/hooks";
import type { LeaveRequest } from "@/modules/leave/types";
import { useEmployeePayslipHistory, useSalaryStructure, useUpsertSalaryStructure } from "@/modules/payroll/hooks";
import { PayslipDetailDialog } from "@/modules/payroll/PayslipDetailDialog";
import type { Payslip, SalaryStructure } from "@/modules/payroll/types";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { EmploymentType, UserRole } from "@/types/enums";
import { formatCurrency, formatDate, formatDuration, formatRelativeTime, initials, toTitleCase } from "@/utils/format";

const EMPLOYMENT_STATUSES = ["active", "on_leave", "suspended", "terminated", "inactive"];

// Mirrors backend/app/routes/employee_profile.py's MANAGE_ROLES exactly.
function canEditEmploymentDetails(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MANAGER;
}

function ComingSoonTab({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <EmptyState
      icon={Icon}
      title={`${label} is being built out`}
      description="The navigation, layout, and data model are already wired up for this tab — deeper functionality lands in a future pass."
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3 w-3" /> Coming soon
        </span>
      }
      className="border-none py-16"
    />
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export function EmployeeProfilePage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const canEdit = canEditEmploymentDetails(role);

  const { data: user, isLoading: userLoading } = useUser(employeeId);
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile(employeeId);
  const { data: timeline, isLoading: timelineLoading } = useEmployeeProfileTimeline(employeeId);

  if (userLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={Users}
        title="Staff member not found"
        description="They may have been removed, or you may not have access to their profile."
        action={
          <Button size="sm" variant="outline" onClick={() => navigate("/people")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
          </Button>
        }
      />
    );
  }

  const name = `${user.first_name} ${user.last_name}`.trim();
  const statusValue = profile?.employment_status ?? user.status;
  const isSelf = currentUserId === user.id;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/people")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
      </Button>

      <div className="mb-5 flex flex-wrap items-center gap-3.5 rounded-xl border border-border bg-card p-4">
        <Avatar className="h-14 w-14 border border-border">
          {user.avatar_url && <AvatarImage src={user.avatar_url.startsWith("http") ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`} alt="" />}
          <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">{initials(user.first_name, user.last_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">{name}</h1>
            <StatusBadge status={statusValue} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{profile?.designation || toTitleCase(user.role)}</span>
            {profile?.department_name && <span>{profile.department_name}</span>}
            {profile?.employee_code && <span className="font-mono text-xs">{profile.employee_code}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="duties">Duties</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {profileLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-[13px] font-semibold text-foreground">Employee overview</h2>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Field label="Employee ID" value={profile?.employee_code} />
                <Field label="Department" value={profile?.department_name} />
                <Field label="Position" value={profile?.designation} />
                <div>
                  <p className="text-[11px] text-muted-foreground">Manager</p>
                  <p className="text-foreground">
                    {profile?.manager_id ? <StaffDirectoryNameCell userId={profile.manager_id} /> : "Unassigned"}
                  </p>
                </div>
                <Field label="Joining date" value={formatDate(profile?.joining_date)} />
                <Field label="Employment type" value={profile?.employment_type ? toTitleCase(profile.employment_type) : undefined} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="personal" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">Personal details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-foreground">{user.email}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="text-foreground">{user.phone ?? "—"}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Cake className="h-3 w-3" /> Date of birth
                </p>
                <p className="text-foreground">{formatDate(user.date_of_birth)}</p>
              </div>
              <Field label="Gender" value={user.gender ? toTitleCase(user.gender) : undefined} />
            </div>
            {user.bio && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Bio</p>
                <p className="mt-1 text-sm text-foreground">{user.bio}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="employment" className="mt-4">
          {profileLoading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : canEdit ? (
            <EmploymentForm userId={user.id} />
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-[13px] font-semibold text-foreground">Employment details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Field label="Employee ID" value={profile?.employee_code} />
                <Field label="Department" value={profile?.department_name} />
                <Field label="Position" value={profile?.designation} />
                <Field label="Employment type" value={profile?.employment_type ? toTitleCase(profile.employment_type) : undefined} />
                <Field label="Employment status" value={profile?.employment_status ? toTitleCase(profile.employment_status) : undefined} />
                <Field label="Office location" value={profile?.office_location} />
                <Field label="Joining date" value={formatDate(profile?.joining_date)} />
                <Field label="Probation ends" value={formatDate(profile?.probation_end_date)} />
                <Field label="Contract start" value={formatDate(profile?.contract_start_date)} />
                <Field label="Contract end" value={formatDate(profile?.contract_end_date)} />
              </div>
              {!isSelf && <p className="mt-4 text-xs text-muted-foreground">Only admins and managers can edit employment details.</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">Employment timeline</h2>
            {timelineLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !timeline || timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No lifecycle events recorded yet.</p>
            ) : (
              <ol className="space-y-4">
                {timeline.map((event, idx) => (
                  <li key={event.id} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock3 className="h-2.5 w-2.5" />
                      </span>
                      {idx < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-[13px] font-medium text-foreground">
                        {toTitleCase(event.event_type)}
                        {event.previous_value && event.new_value && (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            — {event.previous_value} → {event.new_value}
                          </span>
                        )}
                      </p>
                      {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(event.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <EmployeeAttendanceSummaryCard userId={user.id} />
        </TabsContent>
        <TabsContent value="leave" className="mt-4">
          <EmployeeLeaveSummaryCard userId={user.id} />
        </TabsContent>
        <TabsContent value="payroll" className="mt-4">
          <EmployeePayrollSummaryCard userId={user.id} />
        </TabsContent>
        <TabsContent value="duties" className="mt-4">
          <ComingSoonTab icon={ListChecks} label="Duties" />
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <ComingSoonTab icon={CheckCircle2} label="Performance" />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <ComingSoonTab icon={FileText} label="Employee documents" />
        </TabsContent>
        <TabsContent value="communication" className="mt-4">
          <ComingSoonTab icon={MessageSquare} label="Communication" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmployeeAttendanceSummaryCard({ userId }: { userId: string }) {
  const now = new Date();
  const { data: summary, isLoading } = useEmployeeAttendanceSummary(userId, now.getFullYear(), now.getMonth() + 1);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] font-semibold text-foreground">
        This month ({now.toLocaleDateString(undefined, { month: "long", year: "numeric" })})
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Present" value={summary?.present_days ?? 0} icon={UserCheck} accent="success" />
        <StatCard label="Late" value={summary?.late_days ?? 0} icon={Clock3} accent="warning" />
        <StatCard label="Absent" value={summary?.absent_days ?? 0} icon={UserX} accent="danger" />
        <StatCard
          label="Hours worked"
          value={summary?.total_worked_seconds ?? 0}
          icon={CheckCircle2}
          format={(v) => formatDuration(v)}
          accent="info"
        />
      </div>
    </div>
  );
}

function EmployeeLeaveSummaryCard({ userId }: { userId: string }) {
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance(userId);
  const { data: requests, isLoading: requestsLoading } = useLeaveRequests({ user_id: userId, limit: 5 });
  const { data: leaveTypes } = useLeaveTypes();

  const columns: ColumnDef<LeaveRequest, any>[] = [
    {
      accessorKey: "leave_type_id",
      header: "Type",
      cell: ({ getValue }) => leaveTypes?.items.find((t) => t.id === getValue<string>())?.name ?? "—",
    },
    { accessorKey: "start_date", header: "From", cell: ({ getValue }) => formatDate(getValue<string>()) },
    { accessorKey: "end_date", header: "To", cell: ({ getValue }) => formatDate(getValue<string>()) },
    { accessorKey: "requested_days", header: "Days", cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  ];

  if (balanceLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-[13px] font-semibold text-foreground">Balance ({balance?.year ?? new Date().getFullYear()})</p>
        {balance && balance.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {balance.items.map((entry) => (
              <StatCard key={entry.leave_type_id} label={entry.leave_type_name} value={entry.remaining_days} icon={CalendarClock} accent="info" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No leave types configured yet.</p>
        )}
      </div>

      <div>
        <p className="mb-3 text-[13px] font-semibold text-foreground">Recent requests</p>
        <DataTable
          columns={columns}
          data={requests?.items ?? []}
          isLoading={requestsLoading}
          getRowId={(row) => row.id}
          emptyState={<EmptyState icon={CalendarClock} title="No leave requests yet" className="border-none py-10" />}
        />
      </div>
    </div>
  );
}

// Mirrors backend/app/routes/payroll.py's MANAGE_ROLES exactly — deliberately
// tighter than canEditEmploymentDetails (excludes manager), since payroll is
// the one People/HR domain that moves money.
function canManagePayroll(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

function EmployeePayrollSummaryCard({ userId }: { userId: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const canManage = canManagePayroll(role);
  const { data: structure, isLoading: structureLoading } = useSalaryStructure(userId);
  const { data: payslips, isLoading: payslipsLoading } = useEmployeePayslipHistory(userId);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);

  const columns: ColumnDef<Payslip, any>[] = [
    { accessorKey: "run_period", header: "Period" },
    { accessorKey: "run_status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    {
      accessorKey: "net_pay",
      header: "Net pay",
      cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.net_pay, row.original.currency)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      {structureLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : canManage ? (
        <SalaryStructureForm userId={userId} structure={structure ?? null} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-foreground">Salary</h2>
          {structure ? (
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Basic salary" value={formatCurrency(structure.basic_salary, structure.currency)} />
              <Field label="Bank" value={structure.bank_name} />
              <Field label="Account holder" value={structure.bank_account_name} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No salary structure set.</p>
          )}
        </div>
      )}

      <div>
        <p className="mb-3 text-[13px] font-semibold text-foreground">Payslip history</p>
        <DataTable
          columns={columns}
          data={payslips?.items ?? []}
          isLoading={payslipsLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => setSelectedPayslipId(row.id)}
          emptyState={<EmptyState icon={Banknote} title="No payslips yet" className="border-none py-10" />}
        />
      </div>

      <PayslipDetailDialog
        payslipId={selectedPayslipId}
        open={selectedPayslipId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPayslipId(null);
        }}
        canManage={canManage}
      />
    </div>
  );
}

function SalaryStructureForm({ userId, structure }: { userId: string; structure: SalaryStructure | null }) {
  const upsert = useUpsertSalaryStructure(userId);
  const [basicSalary, setBasicSalary] = useState("");
  const [currency, setCurrency] = useState("NPR");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  useEffect(() => {
    setBasicSalary(structure ? String(structure.basic_salary) : "");
    setCurrency(structure?.currency ?? "NPR");
    setBankName(structure?.bank_name ?? "");
    setBankAccountName(structure?.bank_account_name ?? "");
    setBankAccountNumber(structure?.bank_account_number ?? "");
  }, [structure]);

  function handleSave() {
    const salary = Number(basicSalary);
    if (!salary || salary <= 0) return;
    upsert.mutate({
      basic_salary: salary,
      currency: currency || "NPR",
      bank_name: bankName || null,
      bank_account_name: bankAccountName || null,
      bank_account_number: bankAccountNumber || null,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Salary</h2>
        <Button size="sm" disabled={!basicSalary || upsert.isPending} onClick={handleSave}>
          {upsert.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Basic salary</Label>
          <Input type="number" min={0} value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} placeholder="50000" />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} placeholder="NPR" />
        </div>
        <div className="space-y-1.5">
          <Label>Bank name</Label>
          <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label>Account holder name</Label>
          <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label>Account number</Label>
          <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Optional" />
        </div>
      </div>
    </div>
  );
}

function EmploymentForm({ userId }: { userId: string }) {
  const { data: profile } = useEmployeeProfile(userId);
  const { data: departments } = useDepartments({ limit: 100 });
  const upsert = useUpsertEmployeeProfile(userId);

  const [employeeCode, setEmployeeCode] = useState("");
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [designation, setDesignation] = useState("");
  const [employmentType, setEmploymentType] = useState<string | undefined>(undefined);
  const [employmentStatus, setEmploymentStatus] = useState<string | undefined>(undefined);
  const [officeLocation, setOfficeLocation] = useState("");
  const [managerId, setManagerId] = useState<string | undefined>(undefined);
  const [joiningDate, setJoiningDate] = useState("");
  const [probationEndDate, setProbationEndDate] = useState("");
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");

  useEffect(() => {
    setEmployeeCode(profile?.employee_code ?? "");
    setDepartmentId(profile?.department_id ?? undefined);
    setDesignation(profile?.designation ?? "");
    setEmploymentType(profile?.employment_type ?? undefined);
    setEmploymentStatus(profile?.employment_status ?? undefined);
    setOfficeLocation(profile?.office_location ?? "");
    setManagerId(profile?.manager_id ?? undefined);
    setJoiningDate(profile?.joining_date ?? "");
    setProbationEndDate(profile?.probation_end_date ?? "");
    setContractStartDate(profile?.contract_start_date ?? "");
    setContractEndDate(profile?.contract_end_date ?? "");
  }, [profile]);

  function handleSave() {
    upsert.mutate({
      employee_code: employeeCode || null,
      department_id: departmentId ?? null,
      designation: designation || null,
      employment_type: (employmentType as EmploymentType) || null,
      employment_status: employmentStatus || null,
      office_location: officeLocation || null,
      manager_id: managerId ?? null,
      joining_date: joiningDate || null,
      probation_end_date: probationEndDate || null,
      contract_start_date: contractStartDate || null,
      contract_end_date: contractEndDate || null,
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Employment details</h2>
        <Button size="sm" disabled={upsert.isPending} onClick={handleSave}>
          {upsert.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Employee ID</Label>
          <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="EMP-001" />
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={departmentId ?? "none"} onValueChange={(v) => setDepartmentId(v === "none" ? undefined : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select department…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {(departments?.items ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Position</Label>
          <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Senior Counsellor" />
        </div>

        <div className="space-y-1.5">
          <Label>Employment type</Label>
          <Select value={employmentType ?? "none"} onValueChange={(v) => setEmploymentType(v === "none" ? undefined : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not set</SelectItem>
              {Object.values(EmploymentType).map((t) => (
                <SelectItem key={t} value={t}>
                  {toTitleCase(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Employment status</Label>
          <Select value={employmentStatus ?? "none"} onValueChange={(v) => setEmploymentStatus(v === "none" ? undefined : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not set</SelectItem>
              {EMPLOYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {toTitleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Office location</Label>
          <Input value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} placeholder="Kathmandu HQ" />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <UserCog className="h-3 w-3" /> Manager
          </Label>
          <StaffPicker value={managerId} onChange={setManagerId} placeholder="Select manager…" />
        </div>
        <div className="space-y-1.5">
          <Label>Joining date</Label>
          <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Probation ends</Label>
          <Input type="date" value={probationEndDate} onChange={(e) => setProbationEndDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Contract start</Label>
          <Input type="date" value={contractStartDate} onChange={(e) => setContractStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Contract end</Label>
          <Input type="date" value={contractEndDate} onChange={(e) => setContractEndDate(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
