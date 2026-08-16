import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPicker } from "@/components/shared/UserPicker";
import { TaskPriority, TaskType } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useAuthStore } from "@/services/authStore";
import { useCreateTask } from "./hooks";

export function TaskFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createTask = useCreateTask();
  const currentUser = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(TaskType.FOLLOW_UP);
  const [priority, setPriority] = useState<string>(TaskPriority.MEDIUM);
  const [assignedTo, setAssignedTo] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setType(TaskType.FOLLOW_UP);
      setPriority(TaskPriority.MEDIUM);
      setAssignedTo(currentUser?.id);
      setDueDate("");
      setRemarks("");
    }
  }, [open, currentUser]);

  const canSubmit = Boolean(title && assignedTo);

  function handleSubmit() {
    if (!assignedTo) return;
    createTask.mutate(
      {
        title,
        task_type: type as TaskType,
        priority: priority as TaskPriority,
        assigned_to: assignedTo,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        remarks: remarks || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ask for passport copy" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskPriority).map((p) => (
                    <SelectItem key={p} value={p}>
                      {toTitleCase(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <UserPicker value={assignedTo} onChange={setAssignedTo} placeholder="Select a person…" />
          </div>

          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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
          <Button disabled={!canSubmit || createTask.isPending} onClick={handleSubmit}>
            {createTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
