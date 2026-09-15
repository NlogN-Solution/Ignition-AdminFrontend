import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Eye, FilePlus2, Upload, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploadDialog } from "@/modules/documents/DocumentUploadDialog";
import { openDocumentFile } from "@/modules/documents/openDocument";
import { useAuthStore } from "@/services/authStore";
import { ChecklistItemStatus, UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";
import { useChecklist, useUpdateChecklistItem } from "./hooks";
import { RequestDocumentDialog } from "./RequestDocumentDialog";
import type { ApplicationChecklistItemRead } from "./types";

/**
 * The documents this application is waiting on, and what has come back.
 *
 * Verifying here now moves the underlying `Document` too — the backend mirrors
 * the item's status onto the file through `ChecklistService.update_item`. Before
 * that, pressing Verify wrote `verified` on this row and left the document on
 * `pending`, and `pending` is the column the student's own Documents screen
 * reads. So a counsellor verified a passport, saw it go green here, and the
 * student went on being told it was awaiting review — with nothing they could
 * do about it and no way to tell it had been looked at.
 */
export function DocumentChecklistCard({
  applicationId,
  studentId,
  requestSignal,
}: {
  applicationId: string;
  studentId: string;
  /**
   * Bump this to open the "request document" dialog from outside the card.
   *
   * A counter rather than a boolean: the Quick Actions button on the Overview
   * tab needs to work the second and third time it is pressed too, and a
   * boolean that is already `true` raises no change for an effect to see.
   */
  requestSignal?: number;
}) {
  const { data: items, isLoading } = useChecklist(applicationId);
  const updateItem = useUpdateChecklistItem(applicationId);
  const [uploadTarget, setUploadTarget] = useState<ApplicationChecklistItemRead | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApplicationChecklistItemRead | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canVerify = role !== UserRole.STUDENT;

  useEffect(() => {
    if (requestSignal) setIsRequestOpen(true);
  }, [requestSignal]);

  const { completed, total, awaitingReview } = useMemo(() => {
    const list = items ?? [];
    const done = list.filter(
      (i) => i.status === ChecklistItemStatus.VERIFIED || i.status === ChecklistItemStatus.WAIVED,
    ).length;
    const waiting = list.filter((i) => i.status === ChecklistItemStatus.SUBMITTED).length;
    return { completed: done, total: list.length, awaitingReview: waiting };
  }, [items]);

  function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    updateItem.mutate(
      {
        itemId: rejectTarget.id,
        // The note is what the student is shown as the reason — the backend
        // copies it onto the document's `rejection_reason` when it mirrors the
        // status across, so it has to be written before the status, not after.
        payload: { notes: rejectReason.trim(), status: ChecklistItemStatus.REJECTED },
      },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectReason("");
        },
      },
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-foreground">Document checklist</h2>
        <div className="flex items-center gap-3">
          {awaitingReview > 0 && (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
              {awaitingReview} to review
            </span>
          )}
          {total > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {completed}/{total} complete
            </span>
          )}
          {canVerify && (
            <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setIsRequestOpen(true)}>
              <FilePlus2 className="h-3 w-3" /> Request document
            </Button>
          )}
        </div>
      </div>

      {total > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No checklist yet"
          description="Starting a workflow seeds this automatically from the template's document requirements."
          className="border-none py-8"
        />
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const label = item.document_type ? toTitleCase(item.document_type) : item.custom_label ?? "Document";
            const isDone = item.status === ChecklistItemStatus.VERIFIED || item.status === ChecklistItemStatus.WAIVED;
            return (
              <div key={item.id} className="flex items-center gap-3 py-2.5">
                <CheckCircle2 className={cn("h-4 w-4 shrink-0", isDone ? "text-success" : "text-muted-foreground/30")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-foreground">
                    {label}
                    {!item.is_required && <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>}
                  </p>
                  {item.notes && <p className="truncate text-xs text-muted-foreground">{item.notes}</p>}
                </div>
                <StatusBadge status={item.status} />
                {/* Nothing to look at until something has been sent. */}
                {item.document_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    onClick={() => void openDocumentFile(item.document_id as string, "inline")}
                  >
                    <Eye className="h-3 w-3" /> View
                  </Button>
                )}
                {!item.document_id && (
                  <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setUploadTarget(item)}>
                    <Upload className="h-3 w-3" /> Upload
                  </Button>
                )}
                {canVerify && item.document_id && item.status !== ChecklistItemStatus.VERIFIED && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 text-xs"
                      onClick={() => updateItem.mutate({ itemId: item.id, payload: { status: ChecklistItemStatus.VERIFIED } })}
                    >
                      Verify
                    </Button>
                    {item.status !== ChecklistItemStatus.REJECTED && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 text-xs text-danger"
                        onClick={() => setRejectTarget(item)}
                      >
                        <X className="h-3 w-3" /> Reject
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DocumentUploadDialog
        open={Boolean(uploadTarget)}
        onOpenChange={(open) => !open && setUploadTarget(null)}
        defaultStudentId={studentId}
        applicationId={applicationId}
        defaultDocumentType={uploadTarget?.document_type ?? undefined}
        onUploaded={(document) => {
          if (uploadTarget) {
            updateItem.mutate({ itemId: uploadTarget.id, payload: { document_id: document.id } });
          }
        }}
      />

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject this document</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="What is wrong with it? The applicant is shown this."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || updateItem.isPending} onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestDocumentDialog applicationId={applicationId} open={isRequestOpen} onOpenChange={setIsRequestOpen} />
    </section>
  );
}
