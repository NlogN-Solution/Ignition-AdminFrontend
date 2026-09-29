import { useMemo, useState } from "react";
import { Check, Download, Eye, FileText, FolderOpen, Loader2, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentChecklistCard } from "@/modules/checklist/DocumentChecklistCard";
import { canReviewDocuments, DocumentReasonDialog } from "@/modules/documents/DocumentRowActions";
import { useDocuments, useVerifyDocument } from "@/modules/documents/hooks";
import { openDocumentFile } from "@/modules/documents/openDocument";
import type { DocumentRead } from "@/modules/documents/types";
import { useAuthStore } from "@/services/authStore";
import { DocumentStatus } from "@/types/enums";
import { formatBytes, formatDate, toTitleCase } from "@/utils/format";

/**
 * Everything on file for this application, and the controls to review it.
 *
 * Two sections, because they answer two questions:
 *
 * 1. **The checklist** — what this application asked for, and what came back.
 *    `DocumentChecklistCard` as before: request, upload, verify, reject. The
 *    `requestSignal` prop lets another screen open its request dialog.
 * 2. **Everything the student has uploaded** — the whole of their vault, not
 *    only what a checklist row asked for. A student applying from a course page
 *    uploads their passport and transcripts in the apply flow, often before any
 *    checklist exists, and reviewing a *request* means reading exactly those
 *    files. They used to be reachable only from the separate Documents module,
 *    so deciding on a request meant leaving the application to find them. Each
 *    one can be viewed, downloaded, approved or rejected right here, and the
 *    verdict is the same one the vault and the student's portal show.
 */
export function ApplicationDocuments({
  applicationId,
  studentId,
  requestSignal,
}: {
  applicationId: string;
  studentId: string;
  requestSignal?: number;
}) {
  return (
    <div className="space-y-4">
      <DocumentChecklistCard applicationId={applicationId} studentId={studentId} requestSignal={requestSignal} />
      <StudentUploadsCard studentId={studentId} />
    </div>
  );
}

const AWAITING_REVIEW: string[] = [DocumentStatus.PENDING, DocumentStatus.UPLOADED, DocumentStatus.UNDER_REVIEW];

function StudentUploadsCard({ studentId }: { studentId: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const canReview = canReviewDocuments(role);
  const { data, isLoading } = useDocuments({ student_id: studentId, limit: 200 });
  const [rejecting, setRejecting] = useState<DocumentRead | null>(null);

  const documents = useMemo(
    () =>
      [...(data?.items ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [data],
  );
  const awaitingReview = documents.filter((d) => AWAITING_REVIEW.includes(d.status)).length;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">All documents from this student</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Everything in their vault, including uploads no checklist item asked for.
          </p>
        </div>
        {awaitingReview > 0 && (
          <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            {awaitingReview} to review
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nothing uploaded yet"
          description="Files the student uploads — from the apply flow, their Documents page or a checklist request — appear here."
          className="border-none py-8"
        />
      ) : (
        <div className="divide-y divide-border">
          {documents.map((document) => (
            <StudentUploadRow
              key={document.id}
              document={document}
              canReview={canReview}
              onReject={() => setRejecting(document)}
            />
          ))}
        </div>
      )}

      <DocumentReasonDialog
        document={rejecting}
        mode={rejecting ? "reject" : null}
        onOpenChange={(open) => !open && setRejecting(null)}
      />
    </section>
  );
}

function StudentUploadRow({
  document,
  canReview,
  onReject,
}: {
  document: DocumentRead;
  canReview: boolean;
  onReject: () => void;
}) {
  const verify = useVerifyDocument(document.id);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-foreground">{document.title ?? document.original_file_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {toTitleCase(document.document_type)} · {formatDate(document.created_at)}
          {document.file_size ? ` · ${formatBytes(document.file_size)}` : ""}
        </p>
        {document.status === DocumentStatus.REJECTED && document.rejection_reason && (
          <p className="truncate text-xs text-danger">Rejected: {document.rejection_reason}</p>
        )}
      </div>
      <StatusBadge status={document.status} />
      <Button
        variant="outline"
        size="sm"
        className="h-7 shrink-0 text-xs"
        onClick={() => void openDocumentFile(document.id, "inline")}
      >
        <Eye className="h-3 w-3" /> View
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 shrink-0 text-xs"
        onClick={() => void openDocumentFile(document.id, "attachment")}
      >
        <Download className="h-3 w-3" /> Download
      </Button>
      {canReview && document.status !== DocumentStatus.APPROVED && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 text-xs"
          disabled={verify.isPending}
          onClick={() => verify.mutate(undefined)}
        >
          {verify.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve
        </Button>
      )}
      {canReview && document.status !== DocumentStatus.REJECTED && (
        <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs text-danger" onClick={onReject}>
          <X className="h-3 w-3" /> Reject
        </Button>
      )}
    </div>
  );
}
