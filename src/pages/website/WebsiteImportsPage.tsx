import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useImportCatalogue } from "@/modules/website/hooks";
import type { ImportPreview } from "@/modules/website/types";

/**
 * Upload next cycle's intake workbook.
 *
 * This screen is the difference between a one-off migration and a workflow:
 * without it, importing next September's spreadsheet is a developer task
 * again. The first pass is always a dry run — the diff is what a human is
 * meant to read before four thousand rows change.
 */
export function WebsiteImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const importCatalogue = useImportCatalogue();

  function run(apply: boolean) {
    if (!file) return;
    importCatalogue.mutate({ file, apply }, { onSuccess: setPreview });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Catalogue import"
        description="Load an intake workbook. Nothing is written until you apply the diff."
      />

      <div className="rounded-xl border border-border p-6">
        <input
          ref={input}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => input.current?.click()}>
            <FileSpreadsheet className="h-4 w-4" /> Choose workbook
          </Button>
          <span className="text-sm text-muted-foreground">{file ? file.name : "No file selected"}</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" disabled={!file || importCatalogue.isPending} onClick={() => run(false)}>
              {importCatalogue.isPending && !preview?.applied && <Loader2 className="h-4 w-4 animate-spin" />}
              Preview changes
            </Button>
            <Button
              disabled={!file || !preview || preview.applied || importCatalogue.isPending}
              onClick={() => run(true)}
            >
              <Upload className="h-4 w-4" /> Apply
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Records are never deleted. Anything missing from a newer workbook is unpublished instead, because an
          offering may already be attached to a student's application.
        </p>
      </div>

      {preview && (
        <div className="space-y-4 rounded-xl border border-border p-6">
          <div className="flex items-center gap-2">
            {preview.applied ? (
              <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" /> Applied</Badge>
            ) : (
              <Badge variant="secondary">Dry run — nothing written</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {preview.universities} universities · {preview.routes} entry routes · {preview.offerings.toLocaleString()}{" "}
              offerings read from the workbook
            </span>
          </div>

          {preview.problems.length > 0 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> Problems
              </p>
              <ul className="mt-2 list-inside list-disc text-xs">
                {preview.problems.map((problem) => <li key={problem}>{problem}</li>)}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2">Entity</th>
                  <th className="py-2 text-right">Created</th>
                  <th className="py-2 text-right">Updated</th>
                  <th className="py-2 text-right">Unchanged</th>
                  <th className="py-2 text-right">Unpublished</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.entity} className="border-b border-border/50">
                    <td className="py-2 capitalize">{row.entity}</td>
                    <td className="py-2 text-right tabular-nums">{row.created.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">{row.updated.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{row.unchanged.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">{row.retired.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.report && (
            <>
              <Separator />
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  Extraction report — read this before applying
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">
                  Subjects, course levels and durations are inferred from course titles; the workbook states
                  none of them. Fee figures are a proposal only.
                </p>
                <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {preview.report}
                </pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}
