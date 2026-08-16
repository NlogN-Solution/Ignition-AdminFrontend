import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPicker } from "@/components/shared/UserPicker";
import { PaymentMethod, PaymentStatus, UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useCreatePayment } from "./hooks";

export function PaymentFormDialog({ open, onOpenChange, defaultStudentId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultStudentId?: string }) {
  const createPayment = useCreatePayment();
  const [studentId, setStudentId] = useState<string | undefined>(defaultStudentId);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>(PaymentMethod.CASH);
  const [status, setStatus] = useState<string>(PaymentStatus.COMPLETED);
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      setStudentId(defaultStudentId);
      setAmount("");
      setMethod(PaymentMethod.CASH);
      setStatus(PaymentStatus.COMPLETED);
      setReference("");
      setRemarks("");
    }
  }, [open, defaultStudentId]);

  const canSubmit = Boolean(studentId && amount && Number(amount) > 0);

  function handleSubmit() {
    if (!studentId) return;
    createPayment.mutate(
      {
        student_id: studentId,
        amount: Number(amount),
        payment_method: method as PaymentMethod,
        status: status as PaymentStatus,
        transaction_reference: reference || undefined,
        remarks: remarks || undefined,
        payment_date: new Date().toISOString(),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Applicant</Label>
            <UserPicker value={studentId} onChange={setStudentId} role={UserRole.STUDENT} placeholder="Select applicant…" disabled={Boolean(defaultStudentId)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentMethod).map((m) => (
                    <SelectItem key={m} value={m}>
                      {toTitleCase(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || createPayment.isPending} onClick={handleSubmit}>
            {createPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
