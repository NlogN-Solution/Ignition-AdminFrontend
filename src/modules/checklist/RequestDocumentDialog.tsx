import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentType } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useCreateChecklistItem } from "./hooks";

interface RequestDocumentDialogProps {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDocumentDialog({ applicationId, open, onOpenChange }: RequestDocumentDialogProps) {
  const createItem = useCreateChecklistItem(applicationId);
  const [docType, setDocType] = useState<string>(DocumentType.PASSPORT);
  const [customLabel, setCustomLabel] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setDocType(DocumentType.PASSPORT);
      setCustomLabel("");
      setIsRequired(true);
      setNotes("");
    }
  }, [open]);

  function handleSubmit() {
    createItem.mutate(
      {
        document_type: docType as DocumentType,
        custom_label: customLabel || null,
        is_required: isRequired,
        notes: notes || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
              <Label>Custom label (optional)</Label>
              <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Defaults to document type" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes for the student (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Please upload the bio page only" rows={3} />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={isRequired} onCheckedChange={(checked) => setIsRequired(Boolean(checked))} />
            Required
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={createItem.isPending} onClick={handleSubmit}>
            {createItem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
