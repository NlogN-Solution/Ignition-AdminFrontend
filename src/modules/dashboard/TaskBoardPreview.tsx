import { Link } from "react-router";
import { CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useTasks } from "@/modules/tasks/hooks";
import { TaskStatus } from "@/types/enums";
import { toTitleCase } from "@/utils/format";

const COLUMNS: TaskStatus[] = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];

export function TaskBoardPreview() {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Task board</h2>
        <Link to="/tasks" className="text-xs text-primary hover:underline">
          Open board
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {COLUMNS.map((status) => (
          <TaskColumnPreview key={status} status={status} />
        ))}
      </div>
    </section>
  );
}

function TaskColumnPreview({ status }: { status: TaskStatus }) {
  const { data, isLoading } = useTasks({ status, limit: 3 });

  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <p className="mb-2 px-0.5 text-[11.5px] font-medium text-muted-foreground">
        {toTitleCase(status)} <span className="tabular-nums">({data?.total ?? "—"})</span>
      </p>
      <div className="space-y-1.5">
        {isLoading && <Skeleton className="h-10 w-full" />}
        {data?.items.map((task) => (
          <div key={task.id} className="rounded-md border border-border bg-card p-2">
            <p className="truncate text-[12px] font-medium text-foreground">{task.title}</p>
          </div>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <EmptyState icon={CheckSquare} title="Nothing here" className="border-none py-3" />
        )}
      </div>
    </div>
  );
}
