import { useState } from "react";
import { CalendarDays, ListTodo, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/utils/format";
import {
  useCreatePriorityTask,
  useDeletePriorityTask,
  usePriorityTasks,
  useUpdatePriorityTask,
} from "./hooks";

/**
 * What this student should do next, set by staff.
 *
 * Every task added here appears first under "Priority tasks" on the student's
 * dashboard (labelled as from their counsellor) and on their checklist, and
 * the student gets a notification. They can tick it off but not reword or
 * delete it; staff can do all three here. Ticking it on this card counts as
 * done on the student's side too — it is one record.
 */
export function PriorityTasksCard({ studentId }: { studentId: string }) {
  const { data: tasks, isLoading } = usePriorityTasks(studentId);
  const createTask = useCreatePriorityTask(studentId);
  const updateTask = useUpdatePriorityTask(studentId);
  const deleteTask = useDeletePriorityTask(studentId);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", due_date: "" });

  const open = (tasks ?? []).filter((task) => !task.is_complete);
  const done = (tasks ?? []).filter((task) => task.is_complete);

  function reset() {
    setDraft({ title: "", description: "", due_date: "" });
    setAdding(false);
  }

  function submit() {
    const title = draft.title.trim();
    if (!title) return;
    createTask.mutate(
      { title, description: draft.description.trim() || null, due_date: draft.due_date || null },
      { onSuccess: reset },
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <ListTodo className="h-4 w-4 text-primary" /> Priority tasks
        </h2>
        {!adding && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3">
          <Input
            autoFocus
            maxLength={200}
            placeholder="e.g. Upload your IELTS certificate"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          <Textarea
            rows={2}
            maxLength={2000}
            placeholder="Details for the student (optional)"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Due date"
              className="h-8 flex-1"
              value={draft.due_date}
              onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
            />
            <Button size="sm" variant="ghost" className="h-8" onClick={reset} disabled={createTask.isPending}>
              Cancel
            </Button>
            <Button size="sm" className="h-8" onClick={submit} disabled={!draft.title.trim() || createTask.isPending}>
              {createTask.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add task
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : open.length === 0 && done.length === 0 ? (
        !adding && (
          <p className="text-[12.5px] text-muted-foreground">
            No tasks set. Anything you add shows first on the student's dashboard.
          </p>
        )
      ) : (
        <ul className="space-y-1.5">
          {[...open, ...done].map((task) => (
            <li key={task.id} className="group flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-muted/50">
              <Checkbox
                className="mt-0.5"
                checked={task.is_complete}
                aria-label={task.is_complete ? `Reopen ${task.title}` : `Mark ${task.title} done`}
                onCheckedChange={(checked) => updateTask.mutate({ id: task.id, payload: { completed: checked === true } })}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] leading-snug ${
                    task.is_complete ? "text-muted-foreground line-through" : "font-medium text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && !task.is_complete && (
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{task.description}</p>
                )}
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
                  {task.due_date && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Due {formatDate(task.due_date)}
                    </span>
                  )}
                  {task.assigned_by_name && <span>by {task.assigned_by_name}</span>}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${task.title}`}
                onClick={() => deleteTask.mutate(task.id)}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
