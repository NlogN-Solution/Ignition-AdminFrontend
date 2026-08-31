import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { BookOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useBulkUpdateCourses, useWebsiteCourses, useWebsiteUniversities } from "@/modules/website/hooks";
import { COURSE_SUBJECTS, type WebsiteProgram } from "@/modules/website/types";

const PAGE_SIZE = 25;

/**
 * ~4,800 offerings, so **server-side pagination is not optional** — the whole
 * set is never fetched. `page` / `limit` / `total` go to the backend and the
 * table only ever holds one page.
 *
 * The filter that earns its place is `subject = unclassified`: subjects were
 * derived by a keyword classifier over course titles, so a few hundred rows
 * came back unclassified or low-confidence. This is where that backlog gets
 * worked, and the bulk bar is how it gets worked quickly.
 */
export function WebsiteCoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [university, setUniversity] = useState("all");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [bulkSubject, setBulkSubject] = useState("");
  const debounced = useDebounce(search, 300);

  const { data: universities } = useWebsiteUniversities({ limit: 100 });
  const { data, isLoading } = useWebsiteCourses({
    page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    university_id: university === "all" ? undefined : university,
  });

  const bulk = useBulkUpdateCourses();

  const universityNames = useMemo(
    () => Object.fromEntries((universities?.items ?? []).map((item) => [item.id, item.name])),
    [universities],
  );

  const selectedIds = useMemo(
    () => Object.entries(selection).filter(([, chosen]) => chosen).map(([id]) => id),
    [selection],
  );

  const columns = useMemo<ColumnDef<WebsiteProgram, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Course",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {universityNames[row.original.university_id] ?? "—"}
              {row.original.campus ? ` · ${row.original.campus}` : ""}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) =>
          row.original.subject ? (
            <Badge variant="secondary">{row.original.subject}</Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-500">
              unclassified
            </Badge>
          ),
      },
      {
        accessorKey: "course_level",
        header: "Level",
        cell: ({ row }) => <span className="text-xs">{row.original.course_level ?? "—"}</span>,
      },
      {
        id: "duration",
        header: "Duration",
        cell: ({ row }) =>
          row.original.duration_years ? (
            <span className="text-xs">
              {row.original.duration_years} yr{row.original.duration_years === 1 ? "" : "s"}
              {row.original.placement ? " + placement" : ""}
            </span>
          ) : (
            "—"
          ),
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
    ],
    [universityNames],
  );

  function runBulk(payload: Parameters<typeof bulk.mutate>[0]["payload"]) {
    bulk.mutate({ ids: selectedIds, payload }, { onSuccess: () => setSelection({}) });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Courses"
        description="Every university's offering of every course. Subjects were derived from course titles on import — work the unclassified ones here."
      />

      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search course titles…"
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelection({})}
        bulkActions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={bulkSubject || undefined} onValueChange={setBulkSubject}>
              <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Set subject…" /></SelectTrigger>
              <SelectContent>
                {COURSE_SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!bulkSubject || bulk.isPending}
              onClick={() => runBulk({ subject: bulkSubject as WebsiteProgram["subject"] })}
            >
              Apply
            </Button>
            <Button size="sm" disabled={bulk.isPending} onClick={() => runBulk({ is_published: true })}>
              {bulk.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Publish
            </Button>
            <Button size="sm" variant="outline" disabled={bulk.isPending} onClick={() => runBulk({ is_published: false })}>
              Unpublish
            </Button>
          </div>
        }
        filters={
          <Select
            value={university}
            onValueChange={(value) => {
              setUniversity(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every university</SelectItem>
              {(universities?.items ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/website/courses/${row.id}`)}
        selectable
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        page={page}
        limit={PAGE_SIZE}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState icon={BookOpen} title="No courses match" description="Widen the filters, or run an import." />
        }
      />

      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total.toLocaleString()} offerings. Only this page is fetched — the full catalogue is never
          loaded into the browser.
        </p>
      )}
    </div>
  );
}
