import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Bookmark, Download, Loader2, Plus, Trash2, UserCog, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { LifecycleRail } from "@/components/shared/LifecycleRail";
import { InlineSelectCell } from "@/components/shared/InlineSelectCell";
import { UserPicker } from "@/components/shared/UserPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useLeads, useLeadRowEdits } from "@/modules/leads/hooks";
import { leadService } from "@/modules/leads/service";
import { LeadFormDialog } from "@/modules/leads/LeadFormDialog";
import { PriorityBadge } from "@/modules/leads/PriorityBadge";
import { useSavedLeadFilters } from "@/modules/leads/useSavedLeadFilters";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import { LIFECYCLE_STEPS, STATUS_LABELS, STEP_LABELS, lifecycleOf } from "@/modules/leads/lifecycle";
import type { LeadRead } from "@/modules/leads/types";
import { LeadPriority, LeadSource, LeadStatus, LostReason } from "@/types/enums";
import { toTitleCase, formatDate } from "@/utils/format";
import { exportToCsv } from "@/utils/csv";
import { queryKeys } from "@/constants/queryKeys";

/**
 * Leads — one list, one row per person, the whole journey on the row.
 *
 * ## What this replaces
 *
 * Four tabs (Raw / Prospects / Clients / Lost), each with its own column set and
 * its own idea of what mattered. That arrangement had three concrete problems:
 *
 *   1. **It hid the thing you came for.** Priority and source were shown while
 *      someone was a raw lead and dropped the moment they qualified; the
 *      conversion date existed only under Clients. So no single view ever showed
 *      a person's history, and answering "how did this client reach us" meant
 *      opening the record.
 *   2. **The newest business was in the last tab anyone looked at.** A student
 *      who registers on the portal is created as a *converted* lead by
 *      `link_or_create_lead_for_student` — so self-signups landed straight in
 *      Clients, and the Raw tab, the one staff live in, never showed them.
 *   3. **It made one person four records.** Moving someone forward made them
 *      vanish from the tab you were working in and reappear somewhere else.
 *
 * Now: every lead in one table, sorted by most recently touched, with a
 * `LifecycleRail` on each row showing how far along they are. Stage is a filter,
 * not a tab — narrowing the list instead of switching to a different list.
 *
 * ## On "lost"
 *
 * Lost is no longer a tab, a board column or a headline stat, because it is not
 * a stage anyone works — it is the journey ending. It is still recordable and
 * still visible: a lost lead renders with a red tail and its reason inline, and
 * the stage filter can isolate them when someone genuinely wants that list.
 * Removing the ability to record it would have thrown away a real business fact,
 * so nothing about the backend's `lost` status changed.
 *
 * ## Density
 *
 * `density="spacious"` and a two-line name cell. This is a list people read
 * rather than scan — the row is the unit of work — so it gets 15px type and a
 * 56px row instead of the console's default 13px.
 */

/** Stage filter options. One list; these narrow it rather than switching it. */
const STAGE_FILTERS = [
  { value: "all", label: "All stages" },
  { value: "new,contacted,follow_up", label: "Still working" },
  { value: LeadStatus.NEW, label: "New enquiries" },
  { value: LeadStatus.QUALIFIED, label: "Qualified" },
  { value: LeadStatus.CONVERTED, label: "Clients" },
  { value: LeadStatus.LOST, label: "Closed — lost" },
] as const;

export function LeadsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<string>(() => searchParams.get("stage") ?? "all");
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

  // `statuses` (plural) takes a comma list, `status` a single value — the API
  // has both, and "Still working" is the only filter that needs the former.
  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      statuses: stage.includes(",") ? stage : undefined,
      status: stage !== "all" && !stage.includes(",") ? (stage as LeadRead["status"]) : undefined,
      priority: priority === "all" ? undefined : (priority as LeadPriority),
      source: source === "all" ? undefined : (source as LeadSource),
    }),
    [page, debouncedSearch, stage, priority, source],
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

  /** One export shape for the whole lifecycle, so a CSV is not tab-dependent either. */
  function rowsToCsv(rows: LeadRead[]) {
    return rows.map((l) => ({
      name: `${l.first_name} ${l.last_name ?? ""}`.trim(),
      phone: l.phone,
      email: l.email ?? "",
      stage: STEP_LABELS[lifecycleOf(l).step],
      status: l.status,
      priority: l.priority,
      source: l.source,
      course: l.interested_course ?? "",
      captured: l.created_at,
      qualified: l.qualified_at ?? "",
      converted: l.converted_at ?? "",
      lost_reason: l.lost_reason ?? "",
    }));
  }

  function bulkExport() {
    exportToCsv("leads", rowsToCsv((data?.items ?? []).filter((l) => rowSelection[l.id])));
  }

  function applySavedFilter(id: string) {
    const filter = savedFilters.find((f) => f.id === id);
    if (!filter) return;
    setStage(filter.status ?? "all");
    setPriority(filter.priority ?? "all");
    setSource(filter.source ?? "all");
    setPage(1);
  }

  /**
   * One column set for every lead, whatever stage they are at.
   *
   * Nothing is conditional on status any more. A client keeps the source that
   * brought them in and the priority they were worked at, because that is the
   * history the old tabs threw away — and the Lifecycle column carries where
   * they are, which is the one thing the tabs were really encoding.
   */
  // One instance for the whole table; the row id travels with each mutate call.
  const rowEdits = useLeadRowEdits();

  const columns = useMemo<ColumnDef<LeadRead, any>[]>(
    () => [
      {
        id: "person",
        accessorKey: "first_name",
        header: "Person",
        size: 260,
        cell: ({ row }) => {
          const lead = row.original;
          const name = `${lead.first_name} ${lead.last_name ?? ""}`.trim();
          return (
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold tracking-[-0.01em] text-foreground">{name}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {lead.phone}
                {lead.email ? ` · ${lead.email}` : ""}
              </p>
            </div>
          );
        },
      },
      {
        id: "lifecycle",
        accessorKey: "status",
        header: "Lifecycle",
        size: 230,
        cell: ({ row }) => {
          const lead = row.original;
          const cycle = lifecycleOf(lead);
          return (
            <div className="min-w-0">
              <LifecycleRail
                steps={LIFECYCLE_STEPS.map((s) => STEP_LABELS[s])}
                index={cycle.index}
                ended={cycle.lost}
                note={cycle.lost && cycle.lostReason ? toTitleCase(cycle.lostReason) : null}
              />
              {/* The rail's caption, made editable in place. Moving a lead
                  along its lifecycle was the commonest edit in the console and
                  the only one with no control on the list at all — not even in
                  the detail page's edit dialog, which carries assignment,
                  priority and lost but never status. */}
              <div className="mt-1">
                <InlineSelectCell
                  label="Set lifecycle"
                  value={lead.status}
                  isSaving={rowEdits.status.isPending && rowEdits.status.variables?.id === lead.id}
                  options={LEAD_STATUS_OPTIONS}
                  onChange={(status) => rowEdits.status.mutate({ id: lead.id, status })}
                >
                  <span className="text-[13px] text-muted-foreground">{cycle.statusLabel}</span>
                </InlineSelectCell>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        size: 130,
        cell: ({ getValue }) => <span className="font-medium text-foreground">{toTitleCase(getValue<string>())}</span>,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 120,
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <InlineSelectCell
              label="Set priority"
              value={lead.priority ?? null}
              isSaving={rowEdits.priority.isPending && rowEdits.priority.variables?.id === lead.id}
              options={LEAD_PRIORITY_OPTIONS}
              onChange={(priority) => rowEdits.priority.mutate({ id: lead.id, priority })}
            >
              {lead.priority ? (
                <PriorityBadge priority={lead.priority} />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </InlineSelectCell>
          );
        },
      },
      {
        accessorKey: "assigned_to",
        header: "Owner",
        size: 170,
        // A picker rather than an `InlineSelectCell`: the staff list is
        // searchable and paged, which a fixed option list cannot be.
        cell: ({ row }) => (
          <OwnerCell
            lead={row.original}
            onAssign={(assignedTo) => rowEdits.owner.mutate({ id: row.original.id, assignedTo })}
            isSaving={rowEdits.owner.isPending && rowEdits.owner.variables?.id === row.original.id}
          />
        ),
      },
      {
        // The one date that means the same thing at every stage: when did this
        // record last move. The old tabs each showed a different date column,
        // so two rows side by side were never comparable.
        accessorKey: "updated_at",
        header: "Last activity",
        size: 140,
        cell: ({ row }) => {
          const lead = row.original;
          const due = lead.next_follow_up_at;
          return (
            <div className="min-w-0">
              <p className="truncate text-muted-foreground">{formatDate(lead.updated_at)}</p>
              {due && lead.status !== "lost" && (
                <p className="truncate text-[13px] font-medium text-warning">Follow up {formatDate(due)}</p>
              )}
            </div>
          );
        },
      },
    ],
    [rowEdits],
  );

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Everyone who has reached us, on one row each — from first enquiry through to enrolment."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add lead
          </Button>
        }
      />

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
              <Select
                value={stage}
                onValueChange={(v) => {
                  setStage(v);
                  setPage(1);
                  clearSelection();
                }}
              >
                <SelectTrigger size="sm" className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
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
          onExport={data?.items.length ? () => exportToCsv("leads", rowsToCsv(data.items)) : undefined}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        density="spacious"
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
            title={stage === "all" ? "No leads yet" : "Nothing at this stage"}
            description={
              stage === "all"
                ? "Enquiries from your website, walk-ins and campaigns land here — and so does anyone who registers on the student portal."
                : "Try a different stage, or clear the filter to see everyone."
            }
            action={
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add lead
              </Button>
            }
            className="border-none py-20"
          />
        }
      />

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
          saveFilter({
            name,
            status: stage === "all" ? undefined : stage,
            priority: priority === "all" ? undefined : priority,
            source: source === "all" ? undefined : source,
          });
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


/* ------------------------------------------------- inline edit option lists --- */

/**
 * Every lifecycle value a lead can be moved to from the list.
 *
 * All six, including `lost` and `converted`. The detail page wraps those two in
 * dialogs that collect a reason and create a student account respectively, and
 * those flows still exist and are still the better path — but refusing the
 * transition here would mean the column can express five-sixths of the
 * lifecycle, which is the kind of gap that sends people back to the detail page
 * for one click.
 */
const LEAD_STATUS_OPTIONS = (Object.values(LeadStatus) as LeadStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value] ?? toTitleCase(value),
}));

const LEAD_PRIORITY_OPTIONS = (Object.values(LeadPriority) as LeadPriority[]).map((value) => ({
  value,
  label: toTitleCase(value),
}));

/**
 * The owner cell: the assigned name, click to reassign.
 *
 * `UserPicker` inside a popover rather than a menu of staff, because the staff
 * list is searched server-side and a lead desk of thirty people does not fit in
 * a dropdown. Closes on pick, and stops the click reaching the row so
 * reassigning does not also navigate into the record.
 */
function OwnerCell({
  lead,
  onAssign,
  isSaving,
}: {
  lead: LeadRead;
  onAssign: (userId: string) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          title="Assign this lead"
          className="group/owner -mx-1.5 flex w-[calc(100%+0.75rem)] min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-black/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary dark:hover:bg-white/[0.07]"
        >
          <span className="min-w-0 flex-1 truncate">
            {lead.assigned_to ? (
              <StaffNameCell userId={lead.assigned_to} />
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </span>
          {isSaving && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-2"
        onClick={(event) => event.stopPropagation()}
      >
        <UserPicker
          value={lead.assigned_to}
          onChange={(userId) => {
            onAssign(userId);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
