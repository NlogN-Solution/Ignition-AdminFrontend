import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, FilePlus2, Upload } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentUploadDialog } from "@/modules/documents/DocumentUploadDialog";
import { useAuthStore } from "@/services/authStore";
import { ChecklistItemStatus, UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";
import { useChecklist, useUpdateChecklistItem } from "./hooks";
import { RequestDocumentDialog } from "./RequestDocumentDialog";
import type { ApplicationChecklistItemRead } from "./types";

export function DocumentChecklistCard({ applicationId, studentId }: { applicationId: string; studentId: string }) {
  const { data: items, isLoading } = useChecklist(applicationId);
  const updateItem = useUpdateChecklistItem(applicationId);
  const [uploadTarget, setUploadTarget] = useState<ApplicationChecklistItemRead | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canVerify = role !== UserRole.STUDENT;

  const { completed, total } = useMemo(() => {
    const list = items ?? [];
    const done = list.filter((i) => i.status === ChecklistItemStatus.VERIFIED || i.status === ChecklistItemStatus.WAIVED).length;
    return { completed: done, total: list.length };
  }, [items]);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-foreground">Document checklist</h2>
        <div className="flex items-center gap-3">
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
                </div>
                <StatusBadge status={item.status} />
                {!item.document_id && (
                  <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" onClick={() => setUploadTarget(item)}>
                    <Upload className="h-3 w-3" /> Upload
                  </Button>
                )}
                {canVerify && item.document_id && item.status !== ChecklistItemStatus.VERIFIED && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    onClick={() => updateItem.mutate({ itemId: item.id, payload: { status: ChecklistItemStatus.VERIFIED } })}
                  >
                    Verify
                  </Button>
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
        defaultDocumentType={uploadTarget?.document_type ?? undefined}
        onUploaded={(document) => {
          if (uploadTarget) {
            updateItem.mutate({ itemId: uploadTarget.id, payload: { document_id: document.id } });
          }
        }}
      />

      <RequestDocumentDialog applicationId={applicationId} open={isRequestOpen} onOpenChange={setIsRequestOpen} />
    </section>
  );
}
