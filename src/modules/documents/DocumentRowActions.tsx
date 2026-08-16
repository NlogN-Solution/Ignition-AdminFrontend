import { useState } from "react";
import { Check, Download, Eye, MessageSquarePlus, MoreHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/services/authStore";
import { useCommentDocument, useDeleteDocument, useRejectDocument, useVerifyDocument } from "./hooks";
import { documentService } from "./service";
import type { DocumentRead } from "./types";
import { DocumentStatus, UserRole } from "@/types/enums";

export function canReviewDocuments(role: UserRole | undefined): boolean {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.COUNSELLOR ||
    role === UserRole.ADMISSIONS ||
    role === UserRole.MANAGER
  );
}

export function DocumentReasonDialog({
  document: doc,
  mode,
  onOpenChange,
}: {
  document: DocumentRead | null;
  mode: "reject" | "comment" | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [text, setText] = useState("");
  const reject = useRejectDocument(doc?.id ?? "");
  const comment = useCommentDocument(doc?.id ?? "");

  if (!doc || !mode) return null;

  const isPending = mode === "reject" ? reject.isPending : comment.isPending;

  function handleSubmit() {
    if (!doc || !text.trim()) return;
    if (mode === "reject") {
      reject.mutate({ reason: text }, { onSuccess: () => onOpenChange(false) });
    } else {
      comment.mutate(text, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "reject" ? "Reject document" : "Add comment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>{mode === "reject" ? "Reason" : "Comment"}</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={mode === "reject" ? "Why is this document being rejected?" : "Visible to the student…"}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={mode === "reject" ? "destructive" : "default"} disabled={!text.trim() || isPending} onClick={handleSubmit}>
            {mode === "reject" ? "Reject" : "Add comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentRowActions({
  document: doc,
  onReject,
  onComment,
}: {
  document: DocumentRead;
  onReject: () => void;
  onComment: () => void;
}) {
  const role = useAuthStore((s) => s.user?.role);
  const verify = useVerifyDocument(doc.id);
  const remove = useDeleteDocument();

  function handleDownload() {
    const url = documentService.fileUrl(doc);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.original_file_name;
    link.click();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => window.open(documentService.fileUrl(doc), "_blank")}>
          <Eye className="h-3.5 w-3.5" /> View
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Download
        </DropdownMenuItem>
        {canReviewDocuments(role) && (
          <>
            <DropdownMenuItem disabled={doc.status === DocumentStatus.APPROVED} onSelect={() => verify.mutate(undefined)}>
              <Check className="h-3.5 w-3.5" /> Approve
            </DropdownMenuItem>
            <DropdownMenuItem disabled={doc.status === DocumentStatus.REJECTED} onSelect={onReject}>
              <X className="h-3.5 w-3.5" /> Reject
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onComment}>
              <MessageSquarePlus className="h-3.5 w-3.5" /> Add comment
            </DropdownMenuItem>
          </>
        )}
        {canReviewDocuments(role) && (
          <DropdownMenuItem
            className="text-danger focus:text-danger"
            onSelect={() => {
              if (confirm("Delete this document permanently?")) remove.mutate(doc.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
