import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { useFinalizePayrollRun, useMarkPayrollRunPaid, usePayrollRun, useRunPayslips } from "./hooks";
import { monthLabel } from "./utils";
import type { Payslip } from "./types";
import { PayrollRunStatus } from "@/types/enums";
import { formatCurrency } from "@/utils/format";

export function PayrollRunDetailDialog({
  runId,
  open,
  onOpenChange,
  canManage,
  onSelectPayslip,
}: {
  runId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onSelectPayslip: (payslipId: string) => void;
}) {
  const { data: run } = usePayrollRun(runId ?? undefined);
  const { data: payslips, isLoading } = useRunPayslips(runId ?? undefined);
  const finalize = useFinalizePayrollRun();
  const markPaid = useMarkPayrollRunPaid();

  const columns: ColumnDef<Payslip, any>[] = [
    { accessorKey: "user_id", header: "Employee", cell: ({ getValue }) => <StaffDirectoryNameCell userId={getValue<string>()} /> },
    { accessorKey: "present_days", header: "Present", cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    {
      accessorKey: "paid_leave_days",
      header: "Paid leave",
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    { accessorKey: "unpaid_days", header: "Unpaid", cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
    {
      accessorKey: "net_pay",
      header: "Net pay",
      cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.original.net_pay, row.original.currency)}</span>,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{run ? monthLabel(run.period_year, run.period_month) : "Payroll run"}</DialogTitle>
        </DialogHeader>

        {run && (
          <div className="mb-1 flex items-center justify-between">
            <StatusBadge status={run.status} />
            {canManage && (
              <div className="flex items-center gap-2">
                {run.status === PayrollRunStatus.DRAFT && (
                  <Button size="sm" disabled={finalize.isPending} onClick={() => finalize.mutate(run.id)}>
                    {finalize.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Finalize
                  </Button>
                )}
                {run.status === PayrollRunStatus.FINALIZED && (
                  <Button size="sm" disabled={markPaid.isPending} onClick={() => markPaid.mutate(run.id)}>
                    {markPaid.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Mark paid
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <DataTable
          columns={columns}
          data={payslips?.items ?? []}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => onSelectPayslip(row.id)}
          emptyState={<EmptyState icon={Receipt} title="No payslips in this run" className="border-none py-10" />}
        />
      </DialogContent>
    </Dialog>
  );
}
