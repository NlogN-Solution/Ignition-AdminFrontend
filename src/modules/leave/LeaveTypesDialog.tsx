import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCreateLeaveType, useDeleteLeaveType, useLeaveTypes, useUpdateLeaveType } from "./hooks";
import type { LeaveType } from "./types";

function LeaveTypeForm({ leaveType, onDone }: { leaveType: LeaveType | null; onDone: () => void }) {
  const isEdit = Boolean(leaveType);
  const create = useCreateLeaveType();
  const update = useUpdateLeaveType(leaveType?.id ?? "");
  const [name, setName] = useState("");
  const [days, setDays] = useState("0");
  const [paid, setPaid] = useState(true);

  useEffect(() => {
    setName(leaveType?.name ?? "");
    setDays(String(leaveType?.default_days_per_year ?? 0));
    setPaid(leaveType?.paid ?? true);
  }, [leaveType]);

  const isPending = create.isPending || update.isPending;

  function handleSave() {
    if (!name.trim()) return;
    const payload = { name: name.trim(), default_days_per_year: Number(days) || 0, paid };
    if (isEdit) {
      update.mutate(payload, { onSuccess: onDone });
    } else {
      create.mutate(payload, { onSuccess: onDone });
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual Leave" />
        </div>
        <div className="space-y-1.5">
          <Label>Days / year</Label>
          <Input type="number" min={0} value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={paid} onCheckedChange={setPaid} />
        <Label className="!mb-0">Paid leave</Label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" disabled={!name.trim() || isPending} onClick={handleSave}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

export function LeaveTypesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useLeaveTypes();
  const deleteType = useDeleteLeaveType();
  const [editing, setEditing] = useState<LeaveType | "new" | null>(null);

  useEffect(() => {
    if (!open) setEditing(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave types</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {editing !== null ? (
            <LeaveTypeForm leaveType={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
          ) : (
            <>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !data || data.items.length === 0 ? (
                <EmptyState icon={CalendarClock} title="No leave types yet" className="border-none py-8" />
              ) : (
                <div className="divide-y divide-border">
                  {data.items.map((type) => (
                    <div key={type.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{type.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {type.default_days_per_year} days/year · {type.paid ? "Paid" : "Unpaid"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(type)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-danger hover:text-danger"
                          onClick={() => {
                            if (confirm(`Delete "${type.name}"?`)) deleteType.mutate(type.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing("new")}>
                <Plus className="h-3.5 w-3.5" /> Add leave type
              </Button>
            </>
          )}
        </div>

        {editing === null && (
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
