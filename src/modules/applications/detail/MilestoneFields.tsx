import { useEffect, useMemo, useState } from "react";
import { FileUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ApplicationRead, StatusRequirement } from "@/modules/applications/types";

/**
 * The date, the letter and the extras a milestone status needs — as one form
 * body that two dialogs share.
 *
 * ## Why it is shared rather than duplicated
 *
 * Recording an offer happens from two places and they must behave identically.
 * A counsellor usually gets there by changing the status to "Offer received",
 * which is the moment they have the letter in front of them; they occasionally
 * get there from the Offer card on the Overview tab, to correct a date or
 * replace a file. One form, one set of rules, one submission shape.
 *
 * ## It renders itself from the server's config
 *
 * `requirement` comes from `GET /applications/status-requirements`, the same
 * table the API validates against. A requirement added on the backend appears
 * here without a frontend change, and the two cannot disagree about what an
 * offer needs. There is no `if (status === OFFER_RECEIVED)` in this file.
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

export interface MilestonePayload {
  status: string;
  remarks?: string;
  letter?: File | null;
  fields: Record<string, string>;
}

export interface MilestoneForm {
  requirement: StatusRequirement;
  fields: Record<string, string>;
  setField: (name: string, value: string) => void;
  letter: File | null;
  setLetter: (file: File | null) => void;
  needsLetter: boolean;
  /** Everything required is present. Does not include "is a save in flight". */
  isComplete: boolean;
  payload: (status: string, remarks?: string) => MilestonePayload;
}

/**
 * Form state for one milestone.
 *
 * `reset` is a value that changes whenever the form should start again — the
 * dialog's `open` flag, or the selected status. Passing the status matters in
 * the status dialog, where someone can pick "Offer received", then change their
 * mind and pick "CAS received": without it the CAS form would open holding the
 * offer's date.
 */
export function useMilestoneForm({
  requirement,
  application,
  reset,
}: {
  requirement: StatusRequirement | undefined;
  application: ApplicationRead;
  reset: unknown;
}): MilestoneForm | null {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [letter, setLetter] = useState<File | null>(null);

  const dateField = requirement?.required_date_field ?? null;
  const optionalFields = requirement?.optional_fields;

  useEffect(() => {
    if (!requirement) return;
    // Prefill from whatever is already recorded, so correcting a date is an
    // edit rather than a re-entry. Today's date only where there is nothing —
    // an offer being recorded now almost always arrived today.
    const existing = application as unknown as Record<string, string | null>;
    const next: Record<string, string> = {};
    if (dateField) {
      next[dateField] =
        (existing[dateField] ?? "")?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    }
    for (const field of optionalFields ?? []) {
      const value = existing[field];
      if (value !== null && value !== undefined) next[field] = String(value);
    }
    setFields(next);
    setLetter(null);
    // `reset` is the trigger; `requirement` and `application` are the sources.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, requirement, application, dateField, optionalFields]);

  /**
   * The letter is required unless one is already on the application.
   *
   * Whether a letter is on file is not something the API returns, so this
   * cannot know for certain — the backend does, and re-checks. What it can do
   * is avoid blocking a save when the date column is already set, which is the
   * signal that this milestone was recorded before and is being corrected.
   */
  const alreadyRecorded = Boolean(
    dateField && (application as unknown as Record<string, string | null>)[dateField],
  );
  const needsLetter = Boolean(requirement?.required_document) && !alreadyRecorded;

  const isComplete = useMemo(() => {
    if (dateField && !fields[dateField]) return false;
    if (needsLetter && !letter) return false;
    return true;
  }, [dateField, fields, needsLetter, letter]);

  if (!requirement) return null;

  return {
    requirement,
    fields,
    setField: (name, value) => setFields((current) => ({ ...current, [name]: value })),
    letter,
    setLetter,
    needsLetter,
    isComplete,
    payload: (status, remarks) => ({ status, remarks: remarks || undefined, letter, fields }),
  };
}

export function MilestoneFields({ form, idPrefix = "milestone" }: { form: MilestoneForm; idPrefix?: string }) {
  const { requirement, fields, setField, letter, setLetter, needsLetter } = form;
  const dateField = requirement.required_date_field;

  return (
    <>
      {dateField && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-${dateField}`}>{FIELD_LABELS[dateField] ?? "Date"}</Label>
          <Input
            id={`${idPrefix}-${dateField}`}
            type="date"
            required
            value={fields[dateField] ?? ""}
            onChange={(event) => setField(dateField, event.target.value)}
          />
          <p className="text-[12px] text-muted-foreground">
            The date the university issued it, not the date you are filing it.
          </p>
        </div>
      )}

      {requirement.required_document && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-letter`}>
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
                id={`${idPrefix}-letter`}
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
            <Select value={fields[field] ?? ""} onValueChange={(value) => setField(field, value)}>
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
            <Label htmlFor={`${idPrefix}-${field}`}>{FIELD_LABELS[field] ?? field}</Label>
            <Input
              id={`${idPrefix}-${field}`}
              value={fields[field] ?? ""}
              onChange={(event) => setField(field, event.target.value)}
            />
          </div>
        ),
      )}
    </>
  );
}
