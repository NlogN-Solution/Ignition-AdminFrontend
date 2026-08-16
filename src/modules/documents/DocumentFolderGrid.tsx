import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, FolderOpen, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useDocumentFolders } from "./hooks";
import { DocumentFolderCard } from "./DocumentFolderCard";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import type { DocumentFolderSort } from "./types";

const SORT_LABELS: Record<DocumentFolderSort, string> = {
  recent: "Recently updated",
  name: "Student name A-Z",
  count: "Most documents",
  pending: "Pending documents",
};

const LIMIT = 24;

export function DocumentFolderGrid() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DocumentFolderSort>("recent");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [uploadOpen, setUploadOpen] = useQueryFlagDialog();

  const params = useMemo(
    () => ({ page, limit: LIMIT, search: debouncedSearch || undefined, sort }),
    [page, debouncedSearch, sort],
  );
  const { data, isLoading } = useDocumentFolders(params);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Browse each applicant's documents — one folder per student, no subfolders."
        actions={
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Upload document
          </Button>
        }
      />

      <div className="mb-4">
        <ListToolbar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search students…"
          filters={
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as DocumentFolderSort);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="h-8 w-[190px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as DocumentFolderSort[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search ? "No students match your search" : "No student documents yet"}
          description={
            search
              ? "Try a different name, email, or phone number."
              : "A folder appears here automatically the moment a student's first document is uploaded."
          }
          action={
            !search && (
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Upload document
              </Button>
            )
          }
          className="border-none py-20"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((folder) => (
              <DocumentFolderCard key={folder.student_id} folder={folder} onClick={() => navigate(`/documents/${folder.student_id}`)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} of {data.total} students
              </p>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-[70px] text-center text-xs tabular-nums text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
