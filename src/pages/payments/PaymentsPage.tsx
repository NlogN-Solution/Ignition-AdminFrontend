import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Clock, Plus, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { usePayments } from "@/modules/payments/hooks";
import { PaymentFormDialog } from "@/modules/payments/PaymentFormDialog";
import { RevenueChart } from "@/modules/payments/RevenueChart";
import type { PaymentRead } from "@/modules/payments/types";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { useAuthStore } from "@/services/authStore";
import { PaymentMethod, PaymentStatus, UserRole } from "@/types/enums";
import { exportToCsv } from "@/utils/csv";
import { formatCurrency, formatDate, toTitleCase } from "@/utils/format";

export function PaymentsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isStudent = role === UserRole.STUDENT;

  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      status: status === "all" ? undefined : (status as PaymentStatus),
      payment_method: method === "all" ? undefined : (method as PaymentMethod),
    }),
    [page, status, method],
  );
  const { data, isLoading } = usePayments(params);

  const totalCompleted = useMemo(
    () => (data?.items ?? []).filter((p) => p.status === PaymentStatus.COMPLETED).reduce((sum, p) => sum + p.amount, 0),
    [data],
  );
  const totalDue = useMemo(
    () =>
      (data?.items ?? [])
        .filter((p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING)
        .reduce((sum, p) => sum + p.amount, 0),
    [data],
  );

  const columns = useMemo<ColumnDef<PaymentRead, any>[]>(
    () => [
      ...(isStudent
        ? []
        : [
          {
            accessorKey: "student_id",
            header: "Applicant",
            cell: ({ getValue }: { getValue: () => string }) => <StudentNameCell userId={getValue()} />,
          } as ColumnDef<PaymentRead, any>,
        ]),
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => <span className="tabular-nums font-medium text-foreground">{formatCurrency(row.original.amount, row.original.currency)}</span>,
      },
      {
        accessorKey: "payment_method",
        header: "Method",
        cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span>,
      },

      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },

      { accessorKey: "remarks", header: "Remarks", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },

      { accessorKey: "transaction_reference", header: "Reference", cell: ({ getValue }) => getValue<string>() || "—" },
      { accessorKey: "created_at", header: "Date", cell: ({ getValue }) => formatDate(getValue<string>()) },
    ],
    [isStudent],
  );

  return (
    <div>
      <PageHeader
        title={isStudent ? "My payments" : "Payments"}
        description={isStudent ? "Your fees, dues, and payment history." : "Fees, deposits, and revenue across every applicant."}
        actions={
          !isStudent && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Record payment
            </Button>
          )
        }
      />

      {isStudent ? (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Already paid" value={totalCompleted} icon={Wallet} format={(v) => formatCurrency(v)} accent="success" />
          <StatCard label="Upcoming / due" value={totalDue} icon={Clock} format={(v) => formatCurrency(v)} accent="warning" />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
            <p className="mb-1 text-[13px] font-medium text-foreground">Revenue, last 6 months</p>
            <RevenueChart />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[13px] font-medium text-foreground">This page</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{formatCurrency(totalCompleted)}</p>
            <p className="text-xs text-muted-foreground">completed payments shown</p>
          </div>
        </div>
      )}

      <div className="mb-3">
        <ListToolbar
          filters={
            <>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.values(PaymentStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger size="sm" className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {Object.values(PaymentMethod).map((m) => (
                    <SelectItem key={m} value={m}>
                      {toTitleCase(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          onExport={
            data?.items.length
              ? () =>
                exportToCsv(
                  "payments",
                  data.items.map((p) => ({
                    amount: p.amount,
                    currency: p.currency,
                    method: p.payment_method,
                    status: p.status,
                    reference: p.transaction_reference ?? "",
                    date: p.created_at,
                  })),
                )
              : undefined
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
          <EmptyState
            icon={isStudent ? Receipt : Wallet}
            title="No payments recorded"
            description={isStudent ? "Your fees and payment history will show up here." : "Fees and deposits you record will show up here."}
            action={
              !isStudent && (
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Record payment
                </Button>
              )
            }
            className="border-none py-20"
          />
        }
      />

      {!isStudent && <PaymentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
    </div>
  );
}
