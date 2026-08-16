import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckSquare, LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useTasks } from "@/modules/tasks/hooks";
import { TaskFormDialog } from "@/modules/tasks/TaskFormDialog";
import { TaskBoard } from "@/modules/tasks/TaskBoard";
import type { TaskRead } from "@/modules/tasks/types";
import { TaskPriority, TaskStatus } from "@/types/enums";
import { formatDate, toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";

export function TasksPage() {
  const [view, setView] = useState<"board" | "table">("board");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : (status as TaskStatus),
      priority: priority === "all" ? undefined : (priority as TaskPriority),
    }),
    [page, debouncedSearch, status, priority],
  );
  const { data, isLoading } = useTasks(params);

  const columns = useMemo<ColumnDef<TaskRead, any>[]>(
    () => [
      { accessorKey: "title", header: "Task" },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      { accessorKey: "due_date", header: "Due", cell: ({ getValue }) => formatDate(getValue<string>()) },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything the team needs to follow up on."
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setView("board")}
                className={cn("rounded-md p-1.5", view === "board" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={cn("rounded-md p-1.5", view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create task
            </Button>
          </>
        }
      />

      <div className="mb-3">
        <ListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tasks…"
          filters={
            view === "table" && (
              <>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(TaskStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {toTitleCase(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger size="sm" className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {Object.values(TaskPriority).map((p) => (
                      <SelectItem key={p} value={p}>
                        {toTitleCase(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )
          }
        />
      </div>

      {view === "board" ? (
        <TaskBoard search={debouncedSearch} />
      ) : (
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
              icon={CheckSquare}
              title="No tasks yet"
              description="Create a task to keep track of follow-ups and deadlines."
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Create task
                </Button>
              }
              className="border-none py-20"
            />
          }
        />
      )}

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
