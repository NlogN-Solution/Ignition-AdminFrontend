import { useEffect, useRef, useState } from "react";
import { Loader2, UploadCloud, File as FileIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPicker } from "@/components/shared/UserPicker";
import { useAuthStore } from "@/services/authStore";
import { DocumentType, UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";
import { useUploadDocument } from "./hooks";
import type { DocumentRead } from "./types";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentId?: string;
  defaultDocumentType?: DocumentType;
  onUploaded?: (document: DocumentRead) => void;
}

export function DocumentUploadDialog({ open, onOpenChange, defaultStudentId, defaultDocumentType, onUploaded }: DocumentUploadDialogProps) {
  const upload = useUploadDocument();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const isStudent = currentUser?.role === UserRole.STUDENT;
  const effectiveDefaultStudentId = isStudent ? currentUser?.id : defaultStudentId;
  const [studentId, setStudentId] = useState<string | undefined>(effectiveDefaultStudentId);
  const [docType, setDocType] = useState<string>(defaultDocumentType ?? DocumentType.PASSPORT);
  const [title, setTitle] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (open) {
      setStudentId(effectiveDefaultStudentId);
      setDocType(defaultDocumentType ?? DocumentType.PASSPORT);
      setTitle("");
      setRemarks("");
      setFile(null);
    }
  }, [open, effectiveDefaultStudentId, defaultDocumentType]);

  const canSubmit = Boolean(studentId && file);

  function handleSubmit() {
    if (!studentId || !file) return;
    upload.mutate(
      { student_id: studentId, document_type: docType as DocumentType, file, title: title || undefined, remarks: remarks || undefined },
      {
        onSuccess: (document) => {
          onOpenChange(false);
          onUploaded?.(document);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) setFile(dropped);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <FileIcon className="h-6 w-6 text-primary" />
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-7 text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-3 w-3" /> Remove
                </Button>
              </>
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Drag a file here, or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, or PNG — up to your consultancy's usual limits</p>
              </>
            )}
          </div>

          {!isStudent && (
            <div className="space-y-1.5">
              <Label>Applicant</Label>
              <UserPicker value={studentId} onChange={setStudentId} role={UserRole.STUDENT} placeholder="Select applicant…" disabled={Boolean(defaultStudentId)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Document type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to file name" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || upload.isPending} onClick={handleSubmit}>
            {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
