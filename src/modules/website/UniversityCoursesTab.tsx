import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { BookOpen, Search } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useWebsiteCourses } from "./hooks";
import type { WebsiteProgram } from "./types";

const PAGE_SIZE = 20;

/**
 * What this university actually offers, on the university's own record.
 *
 * A course is only ever reached through the university that teaches it, so
 * the standalone Courses list has come off the sidebar and this is where the
 * catalogue is worked. It is the same `/programs` query, pinned to one
 * `university_id` — server-paginated, because "every offering of every course"
 * is ~4,800 rows and a university with four hundred of them is not unusual.
 *
 * **Editing happens on the course's own page, not here.** A course carries a
 * subject, a level, a duration, a campus, a fee tier, entry requirements and
 * two independent visibility flags; that is a form, and a form nested inside
 * the university's own unsaved form is a way to lose one of them. So a row
 * opens the course — full editor, its own save button, its own delete — and
 * this table stays a table.
 */
export function UniversityCoursesTab({ universityId }: { universityId: string }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useWebsiteCourses({
    page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    university_id: universityId,
  });

  const columns = useMemo<ColumnDef<WebsiteProgram, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Course",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.qualification ?? "—"}
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
    [],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            // This table lives inside the university's own <form>. Without
            // this, Enter in the search box submits that form and saves the
            // university — which is emphatically not what pressing Enter in a
            // search box should do.
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="Search this university's courses…"
            className="h-8 pl-8"
          />
        </div>
        {data ? (
          <p className="text-xs text-muted-foreground">
            {data.total.toLocaleString()} course{data.total === 1 ? "" : "s"} offered
          </p>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/website/courses/${row.id}`)}
        page={page}
        limit={PAGE_SIZE}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={BookOpen}
            title={search ? "No courses match" : "No courses yet"}
            description={
              search
                ? "Try a shorter search term."
                : "Nothing has been imported for this university. Run an import from Website ▸ Imports."
            }
          />
        }
      />

      <p className="text-xs text-muted-foreground">
        A row opens the course on its own page, where it can be edited, published or removed.
      </p>
    </div>
  );
}
