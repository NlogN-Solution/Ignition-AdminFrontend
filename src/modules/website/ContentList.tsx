import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { ContentPageSheet } from "./ContentPageSheet";
import { CONTENT_KIND_LABELS, type ContentKind, type ContentPageRead } from "./contentTypes";
import { useContentPages, useDeleteContentPage } from "./contentHooks";

/**
 * The list behind Pages, Guides and Articles.
 *
 * All three are `content_pages` differing only by `kind`, so they are one
 * screen parameterised rather than three near-copies — the columns staff care
 * about (is it live, what is it called, when did it go out) are the same in
 * every case.
 */
export function ContentList({
  title,
  description,
  kinds,
  icon,
  newLabel,
  hideHeader,
}: {
  title: string;
  description: string;
  kinds: ContentKind[];
  icon: LucideIcon;
  newLabel: string;
  /** Set when the screen already has a header of its own — the Blog tabs do. */
  hideHeader?: boolean;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<string>(kinds.length === 1 ? kinds[0] : "all");
  const [state, setState] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useContentPages({
    page,
    limit: 25,
    search: debounced || undefined,
    kind: kind === "all" ? undefined : kind,
    is_published: state === "all" ? undefined : state === "published",
  });

  const remove = useDeleteContentPage();

  // The API filters by one kind at a time; a screen covering two narrows the
  // page it was handed rather than issuing two requests.
  const items = useMemo(
    () => (data?.items ?? []).filter((item) => kinds.includes(item.kind)),
    [data, kinds],
  );

  const columns = useMemo<ColumnDef<ContentPageRead, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {row.original.slug ? `/${row.original.slug}` : row.original.key}
            </p>
          </div>
        ),
      },
      {
        id: "kind",
        header: "Kind",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{CONTENT_KIND_LABELS[row.original.kind]}</span>
        ),
      },
      {
        accessorKey: "tag",
        header: "Tag",
        cell: ({ row }) => <span className="text-xs">{row.original.tag ?? "—"}</span>,
      },
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
        id: "published_at",
        header: "Published",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.published_at ? new Date(row.original.published_at).toLocaleDateString() : "—"}
          </span>
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
              if (!window.confirm(`Delete “${row.original.title}”? Its blocks go with it.`)) return;
              remove.mutate(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [remove],
  );

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <PageHeader
          title={title}
          description={description}
          actions={
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" /> {newLabel}
            </Button>
          }
        />
      )}

      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search content…"
        filters={
          <>
            {hideHeader && (
              <Button size="sm" className="h-8" onClick={() => setCreating(true)}>
                <Plus className="h-3.5 w-3.5" /> {newLabel}
              </Button>
            )}
            {kinds.length > 1 && (
              <Select
                value={kind}
                onValueChange={(value) => {
                  setKind(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder="Kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kinds</SelectItem>
                  {kinds.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {CONTENT_KIND_LABELS[entry]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={state}
              onValueChange={(value) => {
                setState(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/website/content/${row.id}`)}
        page={page}
        limit={25}
        total={data?.total}
        onPageChange={setPage}
        emptyState={<EmptyState icon={icon} title={`No ${title.toLowerCase()} yet`} description={description} />}
      />

      <ContentPageSheet
        page={null}
        open={creating}
        onOpenChange={setCreating}
        defaultKind={kinds[0]}
        onCreated={(created) => navigate(`/website/content/${created.id}`)}
      />
    </div>
  );
}
