import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  HardDrive,
  Mail,
  Menu,
  Phone,
  Plus,
  Search as SearchIcon,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable } from "@/components/shared/DataTable";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { API_BASE_URL } from "@/services/apiClient";
import { useDebounce } from "@/hooks/useDebounce";
import { useQueryFlagDialog } from "@/hooks/useQueryFlagDialog";
import { useDocumentFolder, useDocumentFolders, useDocuments } from "./hooks";
import { DocumentFolderRow } from "./DocumentFolderCard";
import { DocumentReasonDialog, DocumentRowActions } from "./DocumentRowActions";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import type { DocumentRead } from "./types";
import { DocumentStatus, DocumentType } from "@/types/enums";
import { formatBytes, formatDate, initials, toTitleCase } from "@/utils/format";

export function StudentDocumentWorkspace({ studentId }: { studentId: string }) {
  const navigate = useNavigate();
  const { data: folder, isLoading: folderLoading } = useDocumentFolder(studentId);

  const [sidebarSearch, setSidebarSearch] = useState("");
  const debouncedSidebarSearch = useDebounce(sidebarSearch, 250);
  const { data: sidebarFolders } = useDocumentFolders({ limit: 50, search: debouncedSidebarSearch || undefined, sort: "recent" });
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [docType, setDocType] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [uploadOpen, setUploadOpen] = useQueryFlagDialog();
  const [reasonDialog, setReasonDialog] = useState<{ document: DocumentRead; mode: "reject" | "comment" } | null>(null);

  // Filters/pagination reset when the admin/counsellor jumps to a different student's folder.
  useEffect(() => {
    setSearch("");
    setStatus("all");
    setDocType("all");
    setPage(1);
  }, [studentId]);

  const params = useMemo(
    () => ({
      student_id: studentId,
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : (status as DocumentStatus),
      document_type: docType === "all" ? undefined : (docType as DocumentType),
    }),
    [studentId, page, debouncedSearch, status, docType],
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
      {
        accessorKey: "document_type",
        header: "Type",
        cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span>,
      },
      {
        accessorKey: "file_size",
        header: "Size",
        cell: ({ getValue }) => <span className="text-muted-foreground">{formatBytes(getValue<number | null>())}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      {
        id: "feedback",
        header: "Feedback",
        cell: ({ row }) => {
          const feedback = row.original.rejection_reason ?? row.original.remarks;
          return feedback ? (
            <span className="line-clamp-1 text-xs text-muted-foreground" title={feedback}>
              {feedback}
            </span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          );
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

  const switcherList = (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          placeholder="Search students…"
          className="h-8 pl-8 text-[13px]"
        />
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {(sidebarFolders?.items ?? []).map((f) => (
          <DocumentFolderRow
            key={f.student_id}
            folder={f}
            active={f.student_id === studentId}
            onClick={() => {
              navigate(`/documents/${f.student_id}`);
              setSwitcherOpen(false);
            }}
          />
        ))}
      </div>
    </div>
  );

  if (folderLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!folder) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Folder not found"
        description="This student may not have any documents yet, or you may not have access to their folder."
        action={
          <Button size="sm" variant="outline" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Documents
          </Button>
        }
      />
    );
  }

  const name = `${folder.first_name} ${folder.last_name}`.trim();

  return (
    <div className="flex items-start gap-5">
      <aside className="hidden w-64 shrink-0 xl:block">
        <div className="sticky top-4 h-[calc(100vh-7rem)] rounded-xl border border-border bg-card p-3">{switcherList}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <button type="button" onClick={() => navigate("/documents")} className="flex items-center gap-1 hover:text-foreground">
            Documents
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate font-medium text-foreground">{name}</span>
          <Button variant="outline" size="sm" className="ml-auto h-7 shrink-0 gap-1.5 text-xs xl:hidden" onClick={() => setSwitcherOpen(true)}>
            <Menu className="h-3.5 w-3.5" /> Switch student
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3.5 rounded-xl border border-border bg-card p-4">
          <Avatar className="h-12 w-12 border border-border">
            {folder.avatar_url && (
              <AvatarImage src={folder.avatar_url.startsWith("http") ? folder.avatar_url : `${API_BASE_URL}${folder.avatar_url}`} alt="" />
            )}
            <AvatarFallback className="bg-primary/10 font-medium text-primary">{initials(folder.first_name, folder.last_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">{name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {folder.email}
              </span>
              {folder.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> {folder.phone}
                </span>
              )}
              <span className="font-mono text-[11px] text-muted-foreground/70">ID {folder.student_id.slice(0, 8)}</span>
            </div>
          </div>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Upload document
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total documents" value={folder.document_count} icon={FolderOpen} accent="primary" />
          <StatCard label="Approved" value={folder.approved_count} icon={CheckCircle2} accent="success" />
          <StatCard label="Pending" value={folder.pending_count} icon={Clock} accent="warning" />
          <StatCard label="Rejected" value={folder.rejected_count} icon={XCircle} accent="danger" />
          <StatCard label="Total size" value={folder.total_size} icon={HardDrive} format={(v) => formatBytes(v)} accent="info" />
        </div>

        <div className="mb-3">
          <ListToolbar
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={`Search ${folder.first_name}'s documents…`}
            filters={
              <>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value);
                    setPage(1);
                  }}
                >
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
                <Select
                  value={docType}
                  onValueChange={(value) => {
                    setDocType(value);
                    setPage(1);
                  }}
                >
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
              title={search || status !== "all" || docType !== "all" ? "No documents match your filters" : "No documents yet"}
              description={`Documents ${folder.first_name} submits, or that you upload for them, will show up here.`}
              action={
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Upload document
                </Button>
              }
              className="border-none py-16"
            />
          }
        />
      </div>

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} defaultStudentId={studentId} />
      <DocumentReasonDialog
        document={reasonDialog?.document ?? null}
        mode={reasonDialog?.mode ?? null}
        onOpenChange={(open) => !open && setReasonDialog(null)}
      />

      <Sheet open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <SheetContent side="left" className="flex w-72 flex-col">
          <SheetHeader>
            <SheetTitle>Switch student</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4">{switcherList}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
