import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Bookmark, Download, LayoutGrid, List, Plus, Trash2, UserCog, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserPicker } from "@/components/shared/UserPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useLeads } from "@/modules/leads/hooks";
import { leadService } from "@/modules/leads/service";
import { LeadFormDialog } from "@/modules/leads/LeadFormDialog";
import { LeadPipelineBoard } from "@/modules/leads/LeadPipelineBoard";
import { PriorityBadge } from "@/modules/leads/PriorityBadge";
import { useSavedLeadFilters } from "@/modules/leads/useSavedLeadFilters";
import type { LeadLifecycleTab, LeadRead } from "@/modules/leads/types";
import { LeadPriority, LeadSource, LostReason } from "@/types/enums";
import { toTitleCase, formatDate } from "@/utils/format";
import { exportToCsv } from "@/utils/csv";
import { queryKeys } from "@/constants/queryKeys";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<LeadLifecycleTab, string> = {
  raw: "Raw Leads",
  prospect: "Prospects",
  lost: "Lost",
};

export function LeadsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<LeadLifecycleTab>(
    initialTab === "prospect" || initialTab === "lost" ? initialTab : "raw",
  );
  const [view, setView] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>(searchParams.get("priority") ?? "all");
  const [source, setSource] = useState<string>("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState<"assign" | "priority" | "lost" | null>(null);
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);

  const savedFilters = useSavedLeadFilters((s) => s.filters);
  const saveFilter = useSavedLeadFilters((s) => s.save);
  const removeFilter = useSavedLeadFilters((s) => s.remove);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      statuses: tab === "raw" ? "new,contacted,follow_up" : undefined,
      status: tab === "prospect" ? ("qualified" as const) : tab === "lost" ? ("lost" as const) : undefined,
      priority: priority === "all" ? undefined : (priority as LeadPriority),
      source: source === "all" ? undefined : (source as LeadSource),
    }),
    [page, debouncedSearch, tab, priority, source],
  );

  const { data, isLoading } = useLeads(params);
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  function clearSelection() {
    setRowSelection({});
  }

  async function invalidateAfterBulk() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    clearSelection();
  }

  async function bulkAssign(userId: string) {
    const results = await Promise.allSettled(selectedIds.map((id) => leadService.assign(id, userId)));
    const failed = results.filter((r) => r.status === "rejected").length;
    toast[failed ? "error" : "success"](`Assigned ${selectedIds.length - failed}/${selectedIds.length} leads`);
    await invalidateAfterBulk();
    setBulkAction(null);
  }

  async function bulkPriority(value: LeadPriority) {
    const results = await Promise.allSettled(selectedIds.map((id) => leadService.update(id, { priority: value })));
    const failed = results.filter((r) => r.status === "rejected").length;
    toast[failed ? "error" : "success"](`Updated priority on ${selectedIds.length - failed}/${selectedIds.length} leads`);
    await invalidateAfterBulk();
    setBulkAction(null);
  }

  async function bulkMarkLost(reason: LostReason) {
    const results = await Promise.allSettled(selectedIds.map((id) => leadService.markLost(id, { reason })));
    const failed = results.filter((r) => r.status === "rejected").length;
    toast[failed ? "error" : "success"](`Marked ${selectedIds.length - failed}/${selectedIds.length} leads lost`);
    await invalidateAfterBulk();
    setBulkAction(null);
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} leads permanently? This cannot be undone.`)) return;
    const results = await Promise.allSettled(selectedIds.map((id) => leadService.remove(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    toast[failed ? "error" : "success"](`Deleted ${selectedIds.length - failed}/${selectedIds.length} leads`);
    await invalidateAfterBulk();
  }

  function bulkExport() {
    const rows = (data?.items ?? []).filter((l) => rowSelection[l.id]);
    exportToCsv(
      "leads",
      rows.map((l) => ({
        name: `${l.first_name} ${l.last_name ?? ""}`,
        phone: l.phone,
        email: l.email ?? "",
        status: l.status,
        priority: l.priority,
        source: l.source,
        created_at: l.created_at,
      })),
    );
  }

  function applySavedFilter(id: string) {
    const filter = savedFilters.find((f) => f.id === id);
    if (!filter) return;
    if (filter.status === "qualified") setTab("prospect");
    else if (filter.status === "lost") setTab("lost");
    else setTab("raw");
    setPriority(filter.priority ?? "all");
    setSource(filter.source ?? "all");
  }

  const columns = useMemo<ColumnDef<LeadRead, any>[]>(
    () => [
      {
        accessorKey: "first_name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.first_name} {row.original.last_name ?? ""}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </div>
        ),
      },
      { accessorKey: "priority", header: "Priority", cell: ({ getValue }) => <PriorityBadge priority={getValue()} /> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span>,
      },
      {
        accessorKey: "interested_country",
        header: "Destination",
        cell: ({ getValue }) => getValue<string>() || "—",
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ getValue }) => <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>,
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Acquire and qualify prospects — once converted, they move to the Student module."
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setView("table")}
                className={cn("rounded-md p-1.5", view === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("board")}
                className={cn("rounded-md p-1.5", view === "board" ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add lead
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v as LeadLifecycleTab); setPage(1); clearSelection(); }} className="mb-3">
        <TabsList>
          {(Object.keys(TAB_LABELS) as LeadLifecycleTab[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {view === "table" && (
        <div className="mb-3 space-y-2">
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, phone, or email…"
            selectedCount={selectedIds.length}
            onClearSelection={clearSelection}
            bulkActions={
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkAction("assign")}>
                  <UserCog className="h-3.5 w-3.5" /> Assign
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkAction("priority")}>
                  Priority
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkAction("lost")}>
                  Mark lost
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={bulkExport}>
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs text-danger hover:text-danger" onClick={bulkDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </>
            }
            filters={
              <>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger size="sm" className="h-8 w-[130px] text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {Object.values(LeadPriority).map((p) => (
                      <SelectItem key={p} value={p}>
                        {toTitleCase(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {Object.values(LeadSource).map((s) => (
                      <SelectItem key={s} value={s}>
                        {toTitleCase(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                      <Bookmark className="h-3.5 w-3.5" /> Saved
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {savedFilters.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">No saved filters yet</p>}
                    {savedFilters.map((f) => (
                      <DropdownMenuItem key={f.id} className="flex items-center justify-between" onSelect={() => applySavedFilter(f.id)}>
                        {f.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFilter(f.id);
                          }}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-danger" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onSelect={() => setSaveFilterOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Save current filter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            }
            onExport={
              data?.items.length
                ? () =>
                    exportToCsv(
                      "leads",
                      data.items.map((l) => ({
                        name: `${l.first_name} ${l.last_name ?? ""}`,
                        phone: l.phone,
                        email: l.email ?? "",
                        status: l.status,
                        priority: l.priority,
                        source: l.source,
                        country: l.interested_country ?? "",
                        created_at: l.created_at,
                      })),
                    )
                : undefined
            }
          />
        </div>
      )}

      {view === "table" ? (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
          selectable
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          page={page}
          limit={20}
          total={data?.total}
          onPageChange={setPage}
          emptyState={
            <EmptyState
              icon={UserPlus}
              title={`No ${TAB_LABELS[tab].toLowerCase()}`}
              description="Leads you capture from your website, walk-ins, or campaigns will show up here."
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add lead
                </Button>
              }
              className="border-none py-20"
            />
          }
        />
      ) : (
        <LeadPipelineBoard search={debouncedSearch} />
      )}

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Bulk: assign */}
      <Dialog open={bulkAction === "assign"} onOpenChange={(open) => !open && setBulkAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign {selectedIds.length} leads</DialogTitle>
          </DialogHeader>
          <BulkAssignForm onSubmit={bulkAssign} />
        </DialogContent>
      </Dialog>

      {/* Bulk: priority */}
      <Dialog open={bulkAction === "priority"} onOpenChange={(open) => !open && setBulkAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change priority for {selectedIds.length} leads</DialogTitle>
          </DialogHeader>
          <BulkPriorityForm onSubmit={bulkPriority} />
        </DialogContent>
      </Dialog>

      {/* Bulk: lost */}
      <Dialog open={bulkAction === "lost"} onOpenChange={(open) => !open && setBulkAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark {selectedIds.length} leads lost</DialogTitle>
          </DialogHeader>
          <BulkLostForm onSubmit={bulkMarkLost} />
        </DialogContent>
      </Dialog>

      {/* Save current filter */}
      <SaveFilterDialog
        open={saveFilterOpen}
        onOpenChange={setSaveFilterOpen}
        onSave={(name) => {
          saveFilter({ name, status: tab === "prospect" ? "qualified" : tab === "lost" ? "lost" : undefined, priority: priority === "all" ? undefined : priority, source: source === "all" ? undefined : source });
          setSaveFilterOpen(false);
        }}
      />
    </div>
  );
}

function BulkAssignForm({ onSubmit }: { onSubmit: (userId: string) => void }) {
  const [userId, setUserId] = useState<string | undefined>();
  return (
    <>
      <div className="space-y-1.5">
        <Label>Counsellor</Label>
        <UserPicker value={userId} onChange={setUserId} placeholder="Select counsellor…" />
      </div>
      <DialogFooter>
        <Button disabled={!userId} onClick={() => userId && onSubmit(userId)}>
          Assign
        </Button>
      </DialogFooter>
    </>
  );
}

function BulkPriorityForm({ onSubmit }: { onSubmit: (value: LeadPriority) => void }) {
  const [value, setValue] = useState<string>(LeadPriority.WARM);
  return (
    <>
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LeadPriority).map((p) => (
              <SelectItem key={p} value={p}>
                {toTitleCase(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(value as LeadPriority)}>Apply</Button>
      </DialogFooter>
    </>
  );
}

function BulkLostForm({ onSubmit }: { onSubmit: (reason: LostReason) => void }) {
  const [reason, setReason] = useState<string>(LostReason.NOT_INTERESTED);
  return (
    <>
      <div className="space-y-1.5">
        <Label>Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LostReason).map((r) => (
              <SelectItem key={r} value={r}>
                {toTitleCase(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="destructive" onClick={() => onSubmit(reason as LostReason)}>
          Mark lost
        </Button>
      </DialogFooter>
    </>
  );
}

function SaveFilterDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save current filter</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hot Australia leads" />
        </div>
        <DialogFooter>
          <Button disabled={!name} onClick={() => onSave(name)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
