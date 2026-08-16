import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocuments } from "@/modules/documents/hooks";
import { useExtractDocument } from "@/modules/documents/hooks";
import { toTitleCase } from "@/utils/format";
import type { DocumentExtractionResult } from "@/modules/documents/types";

export function DocumentExtractionCard({ userId }: { userId: string }) {
  const { data } = useDocuments({ student_id: userId, limit: 50 });
  const extract = useExtractDocument();
  const [documentId, setDocumentId] = useState<string>("");
  const [result, setResult] = useState<DocumentExtractionResult | null>(null);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-1 text-[13px] font-semibold text-foreground">Fill from a document</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Pick a document you've already uploaded — like your resume or an education certificate — and this will try to pull details into your
        profile automatically.
      </p>

      <div className="flex items-center gap-2">
        <Select value={documentId} onValueChange={setDocumentId}>
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue placeholder="Select a document…" />
          </SelectTrigger>
          <SelectContent>
            {(data?.items ?? []).map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.title ?? toTitleCase(doc.document_type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 shrink-0 text-xs"
          disabled={!documentId || extract.isPending}
          onClick={() => documentId && extract.mutate(documentId, { onSuccess: setResult })}
        >
          {extract.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Extract data
        </Button>
      </div>

      {result && (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          {result.message}
        </div>
      )}
    </section>
  );
}
