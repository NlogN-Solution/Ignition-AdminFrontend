import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, CircleDot, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useWebsiteUniversities } from "@/modules/website/hooks";
import { UK_REGIONS, type WebsiteUniversity } from "@/modules/website/types";

/**
 * The public-site view of the 44 institutions.
 *
 * This is the one list of the 44 institutions — the separate operational list
 * under Academic data has gone, because two lists of the same rows answering
 * slightly different questions is one list too many.
 *
 * Editing happens on the record's own page, not in a drawer over this one. A
 * forty-field record across ten tabs never fitted in 768px, and the entry
 * requirements matrix — routes across, criteria down — had nowhere to be a
 * grid. Deleting lives there too: it cascades to courses, routes and
 * scholarships, which is not something a list row should be one click from.
 */
export function WebsiteUniversitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [published, setPublished] = useState<string>("all");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useWebsiteUniversities({ page, limit: 25, search: debounced || undefined });

  // Region and publish state are not backend filters on /universities, so they
  // narrow the page in hand rather than the query. At 44 rows that is honest;
  // the courses table, at ~4,800, does the opposite.
  const rows = useMemo(() => {
    let items = data?.items ?? [];
    if (region !== "all") items = items.filter((item) => item.region === region);
    if (published !== "all") items = items.filter((item) => item.is_published === (published === "yes"));
    return items;
  }, [data, region, published]);

  const columns = useMemo<ColumnDef<WebsiteUniversity, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "University",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{row.original.slug ?? "no slug"}</p>
          </div>
        ),
      },
      { accessorKey: "city", header: "City", cell: ({ row }) => row.original.city ?? "—" },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ row }) =>
          row.original.region ? (
            <span className="text-xs">{row.original.region}</span>
          ) : (
            <span className="text-xs text-muted-foreground">unset</span>
          ),
      },
      {
        id: "completeness",
        header: "Page sections",
        cell: ({ row }) => <Completeness university={row.original} />,
      },
      {
        id: "state",
        header: "State",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={row.original.is_published ? "default" : "secondary"}>
              {row.original.is_published ? "Published" : "Draft"}
            </Badge>
            {!row.original.is_active && <Badge variant="outline">Inactive</Badge>}
            {row.original.is_example && <Badge variant="outline">Example</Badge>}
          </div>
        ),
      },
      {
        id: "preview",
        header: "",
        cell: ({ row }) =>
          row.original.is_published && row.original.slug ? (
            <a
              href={`/api/v1/public/universities/${row.original.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              onClick={(event) => event.stopPropagation()}
              title="Preview the public payload"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Universities"
        description="What the public site shows for each institution. A section with no content does not render at all."
      />

      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search universities…"
        filters={
          <>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every region</SelectItem>
                {UK_REGIONS.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={published} onValueChange={setPublished}>
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any state</SelectItem>
                <SelectItem value="yes">Published</SelectItem>
                <SelectItem value="no">Draft</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/website/universities/${row.id}`)}
        page={page}
        limit={25}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No universities match"
            description="Import the intake workbook, or widen the filters."
          />
        }
      />
    </div>
  );
}

/**
 * How much of the public page this record actually fills.
 *
 * Not decoration: because every section hides itself when its field is absent,
 * this count *is* the number of sections a visitor would see.
 */
function Completeness({ university }: { university: WebsiteUniversity }) {
  const sections = [
    Boolean(university.tagline || university.overview),
    Boolean(university.tuition_min || university.living_cost_monthly),
    Boolean(university.entry),
    Boolean(university.facilities?.length || university.international_support?.length),
    Boolean(university.employability),
    Boolean(university.rankings?.length || university.awards?.length),
    Boolean(university.imagery || university.logo_url),
  ];
  const filled = sections.filter(Boolean).length;

  return (
    <div className="flex items-center gap-1.5" title={`${filled} of ${sections.length} page sections have content`}>
      {sections.map((complete, index) => (
        <CircleDot
          key={index}
          className={complete ? "h-3 w-3 text-emerald-500" : "h-3 w-3 text-muted-foreground/30"}
          strokeWidth={complete ? 2.5 : 1.5}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{filled}/{sections.length}</span>
    </div>
  );
}
