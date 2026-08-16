import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAddPayslipLineItem, usePayslip, useRemovePayslipLineItem } from "./hooks";
import { PayrollRunStatus, PayslipLineType } from "@/types/enums";
import { formatCurrency } from "@/utils/format";

export function PayslipDetailDialog({
  payslipId,
  open,
  onOpenChange,
  canManage,
}: {
  payslipId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}) {
  const { data: payslip, isLoading } = usePayslip(payslipId ?? undefined);
  const addItem = useAddPayslipLineItem(payslipId ?? "");
  const removeItem = useRemovePayslipLineItem(payslipId ?? "");

  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<PayslipLineType>(PayslipLineType.ADDITION);

  useEffect(() => {
    if (!open) {
      setShowAddForm(false);
      setLabel("");
      setAmount("");
      setType(PayslipLineType.ADDITION);
    }
  }, [open]);

  const canEditLineItems = canManage && payslip?.run_status === PayrollRunStatus.DRAFT;

  function handleAdd() {
    if (!label.trim() || !amount) return;
    addItem.mutate(
      { type, label: label.trim(), amount: Number(amount) },
      {
        onSuccess: () => {
          setShowAddForm(false);
          setLabel("");
          setAmount("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payslip{payslip ? ` — ${payslip.run_period}` : ""}</DialogTitle>
        </DialogHeader>

        {isLoading || !payslip ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={payslip.run_status} />
              <span className="text-xs text-muted-foreground">{payslip.expected_work_days} work days in period</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Present</p>
                <p className="text-foreground">{payslip.present_days}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Paid leave</p>
                <p className="text-foreground">{payslip.paid_leave_days}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Unpaid days</p>
                <p className="text-foreground">{payslip.unpaid_days}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Basic salary</span>
                <span className="text-foreground">{formatCurrency(payslip.basic_salary, payslip.currency)}</span>
              </div>
              {payslip.attendance_deduction > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attendance deduction ({payslip.unpaid_days} unpaid day(s))</span>
                  <span className="text-danger">-{formatCurrency(payslip.attendance_deduction, payslip.currency)}</span>
                </div>
              )}
              {payslip.line_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {item.label}
                    {canEditLineItems && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-danger"
                        disabled={removeItem.isPending}
                        onClick={() => removeItem.mutate(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </span>
                  <span className={item.type === PayslipLineType.DEDUCTION ? "text-danger" : "text-success"}>
                    {item.type === PayslipLineType.DEDUCTION ? "-" : "+"}
                    {formatCurrency(item.amount, payslip.currency)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <span className="text-foreground">Net pay</span>
                <span className="text-foreground">{formatCurrency(payslip.net_pay, payslip.currency)}</span>
              </div>
            </div>

            {canEditLineItems &&
              (showAddForm ? (
                <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={type} onValueChange={(v) => setType(v as PayslipLineType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PayslipLineType.ADDITION}>Addition</SelectItem>
                        <SelectItem value={PayslipLineType.DEDUCTION}>Deduction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" min={0} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <Input placeholder="Label (e.g. Performance bonus)" value={label} onChange={(e) => setLabel(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!label.trim() || !amount || addItem.isPending} onClick={handleAdd}>
                      {addItem.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add line item
                </Button>
              ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
