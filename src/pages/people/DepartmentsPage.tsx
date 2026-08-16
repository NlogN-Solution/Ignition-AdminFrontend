import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from "@/modules/people/hooks";
import { StaffPicker } from "@/modules/people/StaffPicker";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import type { Department } from "@/modules/people/types";

function DepartmentFormDialog({
  department,
  open,
  onOpenChange,
}: {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(department);
  const create = useCreateDepartment();
  const update = useUpdateDepartment(department?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setName(department?.name ?? "");
      setDescription(department?.description ?? "");
      setManagerId(department?.manager_id ?? undefined);
    }
  }, [open, department]);

  const isPending = create.isPending || update.isPending;

  function handleSubmit() {
    if (!name.trim()) return;
    const payload = { name: name.trim(), description: description || undefined, manager_id: managerId };
    if (isEdit) {
      update.mutate(payload, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit department" : "New department"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Admissions" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Department head (optional)</Label>
            <StaffPicker value={managerId} onChange={setManagerId} placeholder="Select manager…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || isPending} onClick={handleSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();
  const [editing, setEditing] = useState<Department | null>(null);
  const remove = useDeleteDepartment();

  const params = useMemo(() => ({ page, limit: 20, search: debouncedSearch || undefined }), [page, debouncedSearch]);
  const { data, isLoading } = useDepartments(params);

  const columns = useMemo<ColumnDef<Department, any>[]>(
    () => [
      { accessorKey: "name", header: "Department" },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => <span className="line-clamp-1 text-muted-foreground">{getValue<string>() || "—"}</span>,
      },
      {
        accessorKey: "manager_id",
        header: "Department head",
        cell: ({ getValue }) => {
          const id = getValue<string | null>();
          return id ? <StaffDirectoryNameCell userId={id} /> : <span className="text-muted-foreground">Unassigned</span>;
        },
      },
      {
        accessorKey: "employee_count",
        header: "Employees",
        cell: ({ getValue }) => <span className="tabular-nums text-foreground">{getValue<number>()}</span>,
      },
      {
        id: "actions",
        header: "",
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setEditing(row.original)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                className="text-danger focus:text-danger"
                onSelect={() => {
                  if (confirm(`Delete "${row.original.name}"? This can't be undone.`)) remove.mutate(row.original.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [remove],
  );

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Organize staff into departments — Counselling, Admissions, Finance, and so on."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New department
          </Button>
        }
      />

      <div className="mb-3">
        <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search departments…" />
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
            icon={Building2}
            title="No departments yet"
            description="Create departments to organize your staff directory."
            action={
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New department
              </Button>
            }
            className="border-none py-20"
          />
        }
      />

      <DepartmentFormDialog department={null} open={dialogOpen} onOpenChange={setDialogOpen} />
      <DepartmentFormDialog department={editing} open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
