import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePayrollRun } from "./hooks";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function GenerateRunDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreatePayrollRun();
  const [month, setMonth] = useState(currentMonthValue());

  useEffect(() => {
    if (open) setMonth(currentMonthValue());
  }, [open]);

  function handleSubmit() {
    const [year, monthNum] = month.split("-").map(Number);
    if (!year || !monthNum) return;
    create.mutate({ year, month: monthNum }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate payroll run</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Period</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Generates one payslip per employee with a salary set, computed from that month's attendance and approved leave.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!month || create.isPending} onClick={handleSubmit}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
