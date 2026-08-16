import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useDocuments } from "./hooks";
import { DocumentReasonDialog, DocumentRowActions } from "./DocumentRowActions";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import type { DocumentRead } from "./types";
import { StudentNameCell } from "@/modules/users/StudentNameCell";
import { DocumentStatus, DocumentType } from "@/types/enums";
import { formatDate, toTitleCase } from "@/utils/format";

export function StudentDocumentsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [docType, setDocType] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [dialogOpen, setDialogOpen] = useQueryFlagDialog();
  const [reasonDialog, setReasonDialog] = useState<{ document: DocumentRead; mode: "reject" | "comment" } | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : (status as DocumentStatus),
      document_type: docType === "all" ? undefined : (docType as DocumentType),
    }),
    [page, debouncedSearch, status, docType],
  );
  const { data, isLoading } = useDocuments(params);

  const columns = useMemo<ColumnDef<DocumentRead, any>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Document",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium text-foreground">{row.original.title ?? row.original.original_file_name}</span>
          </div>
        ),
      },
      { accessorKey: "student_id", header: "Applicant", cell: ({ getValue }) => <StudentNameCell userId={getValue<string>()} /> },
      {
        accessorKey: "document_type",
        header: "Type",
        cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        id: "feedback",
        header: "Feedback",
        cell: ({ row }) => {
          const feedback = row.original.rejection_reason ?? row.original.remarks;
          return feedback ? <span className="line-clamp-1 text-xs text-muted-foreground" title={feedback}>{feedback}</span> : <span className="text-muted-foreground/40">—</span>;
        },
      },
      { accessorKey: "created_at", header: "Uploaded", cell: ({ getValue }) => formatDate(getValue<string>()) },
      {
        id: "actions",
        header: "",
        size: 48,
        cell: ({ row }) => (
          <DocumentRowActions
            document={row.original}
            onReject={() => setReasonDialog({ document: row.original, mode: "reject" })}
            onComment={() => setReasonDialog({ document: row.original, mode: "comment" })}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Passports, transcripts, offer letters, and everything else applicants submit."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Upload document
          </Button>
        }
      />

      <div className="mb-3">
        <ListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by title or file name…"
          filters={
            <>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.values(DocumentStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger size="sm" className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.values(DocumentType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
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
            icon={FileText}
            title="No documents uploaded"
            description="Passports, transcripts, and offer letters will show up here once uploaded."
            action={
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Upload document
              </Button>
            }
            className="border-none py-20"
          />
        }
      />

      <DocumentUploadDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <DocumentReasonDialog
        document={reasonDialog?.document ?? null}
        mode={reasonDialog?.mode ?? null}
        onOpenChange={(open) => !open && setReasonDialog(null)}
      />
    </div>
  );
}
