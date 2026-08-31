import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Award, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useCreateScholarship,
  useDeleteScholarship,
  useScholarships,
  useUpdateScholarship,
  useWebsiteUniversities,
} from "@/modules/website/hooks";
import type { ScholarshipRead } from "@/modules/website/types";

export function WebsiteScholarshipsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ScholarshipRead | null>(null);
  const [creating, setCreating] = useState(false);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useScholarships({ page, limit: 25, search: debounced || undefined });
  const { data: universities } = useWebsiteUniversities({ limit: 100 });
  const remove = useDeleteScholarship();

  const names = useMemo(
    () => Object.fromEntries((universities?.items ?? []).map((item) => [item.id, item.name])),
    [universities],
  );

  const columns = useMemo<ColumnDef<ScholarshipRead, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Scholarship",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.university_id ? names[row.original.university_id] ?? "—" : row.original.provider ?? "External"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        // Prose, not a number: "5% early payment discount if full fees paid".
        cell: ({ row }) => <span className="text-xs">{row.original.amount ?? "—"}</span>,
      },
      { accessorKey: "deadline", header: "Deadline", cell: ({ row }) => <span className="text-xs">{row.original.deadline ?? "—"}</span> },
      {
        id: "state",
        header: "State",
        cell: ({ row }) => (
          <Badge variant={row.original.is_published ? "default" : "secondary"}>
            {row.original.is_published ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              if (!window.confirm(`Delete “${row.original.name}”?`)) return;
              remove.mutate(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [names, remove],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Scholarships"
        description="Amounts and deadlines are free text, because the source values are sentences — “£2,000 for each year (1st, 2nd & 3rd)”."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> New scholarship
          </Button>
        }
      />

      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search scholarships…"
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={setEditing}
        page={page}
        limit={25}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={Award}
            title="No scholarships yet"
            description="The public site previously invented most of these at render time. Add the real ones here."
          />
        }
      />

      <ScholarshipDialog
        scholarship={editing}
        open={Boolean(editing) || creating}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
      />
    </div>
  );
}

function ScholarshipDialog({
  scholarship,
  open,
  onOpenChange,
}: {
  scholarship: ScholarshipRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(scholarship);
  const create = useCreateScholarship();
  const update = useUpdateScholarship();
  const { data: universities } = useWebsiteUniversities({ limit: 100 });

  const [form, setForm] = useState({
    slug: "",
    name: "",
    provider: "",
    kind: "university",
    university_id: "",
    amount: "",
    deadline: "",
    eligibility: "",
    apply_via: "",
    is_published: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      slug: scholarship?.slug ?? "",
      name: scholarship?.name ?? "",
      provider: scholarship?.provider ?? "",
      kind: scholarship?.kind ?? "university",
      university_id: scholarship?.university_id ?? "",
      amount: scholarship?.amount ?? "",
      deadline: scholarship?.deadline ?? "",
      eligibility: scholarship?.eligibility ?? "",
      apply_via: scholarship?.apply_via ?? "",
      is_published: scholarship?.is_published ?? false,
    });
  }, [open, scholarship]);

  const isPending = create.isPending || update.isPending;

  function submit() {
    const payload = {
      slug: form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: form.name.trim(),
      provider: form.provider || null,
      kind: form.kind || null,
      university_id: form.university_id || null,
      amount: form.amount || null,
      deadline: form.deadline || null,
      eligibility: form.eligibility || null,
      apply_via: form.apply_via || null,
      is_published: form.is_published,
    };
    const done = { onSuccess: () => onOpenChange(false) };
    if (isEdit && scholarship) update.mutate({ id: scholarship.id, payload }, done);
    else create.mutate(payload, done);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit scholarship" : "New scholarship"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="Derived from the name when left blank"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(value) => setForm({ ...form, kind: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>University</Label>
              <Select
                value={form.university_id || "none"}
                onValueChange={(value) => setForm({ ...form, university_id: value === "none" ? "" : value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not university-specific</SelectItem>
                  {(universities?.items ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="£1,000 (for the first year only)"
            />
            <p className="text-xs text-muted-foreground">
              Free text on purpose — forcing these into a number loses the condition attached to them.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Deadline</Label>
            <Input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Eligibility</Label>
            <Textarea rows={3} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>How to apply</Label>
            <Textarea rows={2} value={form.apply_via} onChange={(e) => setForm({ ...form, apply_via: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label>Published on the public site</Label>
            <Switch checked={form.is_published} onCheckedChange={(checked) => setForm({ ...form, is_published: checked })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!form.name.trim() || isPending} onClick={submit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
