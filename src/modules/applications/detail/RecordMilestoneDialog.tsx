import { useEffect, useMemo, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APPLICATION_STATUS_LABELS } from "@/modules/applications/lifecycle";
import type { ApplicationRead, StatusRequirement } from "@/modules/applications/types";
import type { ApplicationStatus } from "@/types/enums";

/**
 * Recording something a university issued: the date, the letter, and the
 * status, together.
 *
 * ## Why this is not `ChangeStatusDialog`
 *
 * Most statuses are Ignition recording its own progress and need a note at
 * most. Two are different in kind — an offer and a CAS are events that
 * happened somewhere else, and the only evidence is a date and a letter. The
 * old flow had the status in one dropdown, the date behind a *different*
 * dialog with eight other dates, and the letter as an unrelated upload in the
 * Documents area, so the normal outcome of recording an offer was an
 * application that claimed one with nothing behind it.
 *
 * ## The form renders itself from the server's config
 *
 * `requirement` comes from `GET /applications/status-requirements`, which is
 * the same table the API validates against. That is the point: a requirement
 * added on the backend appears here without a frontend change, and the two can
 * never disagree about what an offer needs. There is no
 * `if (status === OFFER_RECEIVED)` anywhere in this file.
 *
 * It submits once. The backend writes the date, links the letter, moves the
 * status, records the milestone and notifies the student inside one
 * transaction — see `MilestoneService.record`.
 */

const FIELD_LABELS: Record<string, string> = {
  offer_received_date: "Offer received on",
  cas_received_date: "CAS issued on",
  visa_decision_date: "Decision date",
  offer_type: "Offer type",
  cas_number: "CAS number",
  tuition_fee: "Tuition fee",
  scholarship_amount: "Scholarship",
};

const OFFER_TYPES = [
  { value: "conditional", label: "Conditional" },
  { value: "unconditional", label: "Unconditional" },
  { value: "other", label: "Other" },
];

export function RecordMilestoneDialog({
  open,
  onOpenChange,
  status,
  requirement,
  application,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ApplicationStatus;
  requirement: StatusRequirement;
  application: ApplicationRead;
  isSaving: boolean;
  onSubmit: (payload: {
    status: string;
    remarks?: string;
    letter?: File | null;
    fields: Record<string, string>;
  }) => void;
}) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState("");
  const [letter, setLetter] = useState<File | null>(null);

  const dateField = requirement.required_date_field;

  useEffect(() => {
    if (!open) return;
    // Prefill from whatever is already recorded, so correcting a date is an
    // edit rather than a re-entry. Today's date only where there is nothing —
    // an offer being recorded now almost always arrived today.
    const existing = application as unknown as Record<string, string | null>;
    const next: Record<string, string> = {};
    if (dateField) {
      next[dateField] = (existing[dateField] ?? "")?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    }
    for (const field of requirement.optional_fields) {
      const value = existing[field];
      if (value !== null && value !== undefined) next[field] = String(value);
    }
    setFields(next);
    setRemarks("");
    setLetter(null);
  }, [open, application, dateField, requirement.optional_fields]);

  /**
   * The letter is required unless one is already on the application.
   *
   * `has_letter_on_file` is not a field the API returns, so this cannot know
   * for certain — the backend does, and re-checks. What this can do is avoid
   * blocking a save when the date column is already set, which is the signal
   * that this milestone was recorded before and is being corrected.
   */
  const alreadyRecorded = Boolean(dateField && (application as unknown as Record<string, string | null>)[dateField]);
  const needsLetter = Boolean(requirement.required_document) && !alreadyRecorded;
  const canSave = useMemo(() => {
    if (dateField && !fields[dateField]) return false;
    if (needsLetter && !letter) return false;
    return !isSaving;
  }, [dateField, fields, needsLetter, letter, isSaving]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record {APPLICATION_STATUS_LABELS[status].toLowerCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">{requirement.prompt}</p>

          {dateField && (
            <div className="space-y-1.5">
              <Label htmlFor={dateField}>{FIELD_LABELS[dateField] ?? "Date"}</Label>
              <Input
                id={dateField}
                type="date"
                required
                value={fields[dateField] ?? ""}
                onChange={(event) =>
                  setFields((current) => ({ ...current, [dateField]: event.target.value }))
                }
              />
              <p className="text-[12px] text-muted-foreground">
                The date the university issued it, not the date you are filing it.
              </p>
            </div>
          )}

          {requirement.required_document && (
            <div className="space-y-1.5">
              <Label htmlFor="milestone-letter">
                {requirement.document_label}
                {needsLetter ? "" : " (optional — one is already on file)"}
              </Label>
              {letter ? (
                <p className="flex items-center justify-between gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2 text-[13px]">
                  <span className="min-w-0 truncate font-medium text-foreground">{letter.name}</span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => setLetter(null)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </p>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/50">
                  <FileUp className="h-3.5 w-3.5" />
                  Choose a PDF or image
                  <input
                    id="milestone-letter"
                    type="file"
                    className="hidden"
                    onChange={(event) => setLetter(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              <p className="text-[12px] text-muted-foreground">
                Filed against this application and marked verified — the applicant opens it from their
                portal once they have unlocked their package.
              </p>
            </div>
          )}

          {/* Optional extras, rendered from the config rather than hardcoded. */}
          {requirement.optional_fields.map((field) =>
            field === "offer_type" ? (
              <div key={field} className="space-y-1.5">
                <Label>{FIELD_LABELS[field]}</Label>
                <Select
                  value={fields[field] ?? ""}
                  onValueChange={(value) => setFields((current) => ({ ...current, [field]: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not recorded" />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[12px] text-muted-foreground">
                  A conditional offer is a place <em>if</em> the remaining conditions are met. The
                  applicant is shown which.
                </p>
              </div>
            ) : (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{FIELD_LABELS[field] ?? field}</Label>
                <Input
                  id={field}
                  value={fields[field] ?? ""}
                  onChange={(event) =>
                    setFields((current) => ({ ...current, [field]: event.target.value }))
                  }
                />
              </div>
            ),
          )}

          <div className="space-y-1.5">
            <Label htmlFor="milestone-remarks">Notes (optional)</Label>
            <Textarea
              id="milestone-remarks"
              rows={2}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Anything worth recording against the transition."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => onSubmit({ status, remarks: remarks || undefined, letter, fields })}
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save &amp; notify applicant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
