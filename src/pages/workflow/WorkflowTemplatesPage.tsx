import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Plus, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { useCountries } from "@/modules/academic/hooks";
import {
  useCreateWorkflowTemplate,
  useDeleteWorkflowTemplate,
  useDuplicateWorkflowTemplate,
  useWorkflowTemplates,
} from "@/modules/workflow-templates/hooks";
import type { WorkflowTemplateRead } from "@/modules/workflow-templates/types";
import { formatDate } from "@/utils/format";

export function WorkflowTemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useWorkflowTemplates({ page, limit: 20, search: debounced || undefined });
  const { data: countries } = useCountries({ limit: 100 });
  const countryNameById = useMemo(() => new Map((countries?.items ?? []).map((c) => [c.id, c.name])), [countries]);

  const createTemplate = useCreateWorkflowTemplate();
  const duplicateTemplate = useDuplicateWorkflowTemplate();
  const deleteTemplate = useDeleteWorkflowTemplate();

  const columns = useMemo<ColumnDef<WorkflowTemplateRead, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Template",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            {row.original.description && <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</p>}
          </div>
        ),
      },
      {
        accessorKey: "country_id",
        header: "Country",
        cell: ({ getValue }) => {
          const id = getValue<string | null>();
          return id ? countryNameById.get(id) ?? "—" : <span className="text-muted-foreground">Generic (fallback)</span>;
        },
      },
      { accessorKey: "stage_count", header: "Stages", cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span> },
      {
        accessorKey: "is_default",
        header: "Default",
        cell: ({ getValue }) => (getValue<boolean>() ? <Badge>Default</Badge> : null),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge variant={getValue<boolean>() ? "default" : "outline"}>{getValue<boolean>() ? "Active" : "Disabled"}</Badge>
        ),
      },
      { accessorKey: "updated_at", header: "Updated", cell: ({ getValue }) => formatDate(getValue<string>()) },
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
              <DropdownMenuItem onSelect={() => duplicateTemplate.mutate(row.original.id)}>
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={row.original.is_default}
                className="text-danger focus:text-danger"
                onSelect={() => {
                  if (confirm(`Delete "${row.original.name}"? This cannot be undone.`)) deleteTemplate.mutate(row.original.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [countryNameById, duplicateTemplate, deleteTemplate],
  );

  return (
    <div>
      <PageHeader
        title="Workflow Management"
        description="Configure the admission journey applicants move through — one template per country, no code required."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New template
          </Button>
        }
      />

      <div className="mb-3">
        <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search templates…" />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/workflow/${row.id}`)}
        page={page}
        limit={20}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={WorkflowIcon}
            title="No workflow templates yet"
            description="Create your first template to start tracking applicant journeys."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New template
              </Button>
            }
            className="border-none py-20"
          />
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New workflow template</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Germany Workflow" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newName || createTemplate.isPending}
              onClick={() =>
                createTemplate.mutate(
                  { name: newName },
                  {
                    onSuccess: (template) => {
                      setCreateOpen(false);
                      setNewName("");
                      navigate(`/workflow/${template.id}`);
                    },
                  },
                )
              }
            >
              Create & open builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
