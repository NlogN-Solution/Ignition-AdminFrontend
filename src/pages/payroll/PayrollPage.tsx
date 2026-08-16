import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/services/authStore";
import { useEmployeePayslipHistory, usePayrollRuns } from "@/modules/payroll/hooks";
import { GenerateRunDialog } from "@/modules/payroll/GenerateRunDialog";
import { PayrollRunDetailDialog } from "@/modules/payroll/PayrollRunDetailDialog";
import { PayslipDetailDialog } from "@/modules/payroll/PayslipDetailDialog";
import { monthLabel } from "@/modules/payroll/utils";
import type { PayrollRun, Payslip } from "@/modules/payroll/types";
import { UserRole } from "@/types/enums";
import { formatCurrency, formatDateTime } from "@/utils/format";

function canManagePayroll(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

function canViewTeamPayroll(role: UserRole | undefined): boolean {
  return canManagePayroll(role) || role === UserRole.MANAGER;
}

export function PayrollPage() {
  const currentUser = useAuthStore((s) => s.user);
  const canManage = canManagePayroll(currentUser?.role);
  const canViewTeam = canViewTeamPayroll(currentUser?.role);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: myPayslips, isLoading: myLoading } = useEmployeePayslipHistory(currentUser?.id);
  const { data: runs, isLoading: runsLoading } = usePayrollRuns(canViewTeam ? { page, limit: 12 } : { page: 1, limit: 1 });

  const myColumns = useMemo<ColumnDef<Payslip, any>[]>(
    () => [
      { accessorKey: "run_period", header: "Period" },
      { accessorKey: "run_status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        accessorKey: "net_pay",
        header: "Net pay",
        cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.net_pay, row.original.currency)}</span>,
      },
    ],
    [],
  );

  const runColumns = useMemo<ColumnDef<PayrollRun, any>[]>(
    () => [
      { id: "period", header: "Period", cell: ({ row }) => monthLabel(row.original.period_year, row.original.period_month) },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      { accessorKey: "generated_at", header: "Generated", cell: ({ getValue }) => formatDateTime(getValue<string>()) },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Payroll"
        description={canManage ? "Salary structures, monthly runs, and payslips." : "Your payslip history."}
        actions={
          canManage && (
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Generate run
            </Button>
          )
        }
      />

      <div className="mb-8">
        <p className="mb-3 text-[13px] font-semibold text-foreground">My payslips</p>
        <DataTable
          columns={myColumns}
          data={myPayslips?.items ?? []}
          isLoading={myLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => setSelectedPayslipId(row.id)}
          emptyState={<EmptyState icon={Receipt} title="No payslips yet" className="border-none py-14" />}
        />
      </div>

      {canViewTeam && (
        <div>
          <p className="mb-3 text-[13px] font-semibold text-foreground">Payroll runs</p>
          <DataTable
            columns={runColumns}
            data={runs?.items ?? []}
            isLoading={runsLoading}
            getRowId={(row) => row.id}
            page={page}
            limit={12}
            total={runs?.total}
            onPageChange={setPage}
            onRowClick={(row) => setSelectedRunId(row.id)}
            emptyState={<EmptyState icon={Receipt} title="No payroll runs yet" className="border-none py-14" />}
          />
        </div>
      )}

      <GenerateRunDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      <PayrollRunDetailDialog
        runId={selectedRunId}
        open={selectedRunId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRunId(null);
        }}
        canManage={canManage}
        onSelectPayslip={(id) => setSelectedPayslipId(id)}
      />
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
