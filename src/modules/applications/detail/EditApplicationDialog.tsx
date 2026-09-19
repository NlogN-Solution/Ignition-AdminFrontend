import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ApplicationRead, ApplicationUpdatePayload } from "@/modules/applications/types";

/**
 * The editable facts of an application.
 *
 * There was no edit dialog before this — `ApplicationFormDialog` only creates —
 * so every field below was set once at creation and then unchangeable from the
 * UI, including the dates the whole progress strip is derived from. This uses
 * the existing `PATCH /applications/{id}` and adds no fields the payload did
 * not already accept.
 *
 * Dates go out as `null` when cleared rather than `""`: the API distinguishes
 * "not set" from an empty string, and an empty string is what a date input
 * gives you when someone deletes the value.
 *
 * The "Shown to the student" group is what the student portal prints on the
 * application page: the two Key Deadlines and the "Please note" box (the
 * condition deadline plus one point per line of the notice).
 */

const FIELDS = [
  { key: "application_date", label: "Application date", type: "date" },
  { key: "submission_date", label: "Submission date", type: "date" },
  { key: "offer_received_date", label: "Offer received", type: "date" },
  { key: "visa_applied_date", label: "Visa applied", type: "date" },
  { key: "visa_decision_date", label: "Visa decision", type: "date" },
  { key: "enrollment_date", label: "Enrolment date", type: "date" },
  { key: "tuition_fee", label: "Tuition fee", type: "number" },
  { key: "scholarship_amount", label: "Scholarship amount", type: "number" },
  { key: "university_application_id", label: "University reference", type: "text" },
  { key: "application_deadline", label: "Application deadline", type: "date", student: true },
  { key: "payment_deadline", label: "Payment deadline", type: "date", student: true },
  { key: "condition_deadline", label: "Condition deadline", type: "date", student: true },
] as const;

const NOTICE_KEY = "student_notice";

type FieldKey = (typeof FIELDS)[number]["key"];

export function EditApplicationDialog({
  open,
  onOpenChange,
  application,
  isSaving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationRead;
  isSaving: boolean;
  onSave: (payload: ApplicationUpdatePayload) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset from the record each time the dialog opens, so a cancelled edit does
  // not leak into the next one.
  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const field of FIELDS) {
      const raw = application[field.key as keyof ApplicationRead];
      next[field.key] = raw === null || raw === undefined ? "" : String(raw).slice(0, field.type === "date" ? 10 : undefined);
    }
    next[NOTICE_KEY] = application.student_notice ?? "";
    setValues(next);
  }, [open, application]);

  function submit() {
    const payload: ApplicationUpdatePayload = {};
    for (const field of FIELDS) {
      const raw = values[field.key]?.trim() ?? "";
      const key = field.key as FieldKey;
      if (field.type === "number") {
        (payload as Record<string, unknown>)[key] = raw === "" ? null : Number(raw);
      } else {
        (payload as Record<string, unknown>)[key] = raw === "" ? null : raw;
      }
    }
    const notice = values[NOTICE_KEY]?.trim() ?? "";
    payload.student_notice = notice === "" ? null : notice;
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit application</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.filter((field) => !("student" in field)).map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                inputMode={field.type === "number" ? "decimal" : undefined}
                min={field.type === "number" ? 0 : undefined}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <p className="text-[13px] font-medium text-foreground">Shown to the student</p>
            <p className="text-[12.5px] text-muted-foreground">
              Key Deadlines and the "Please note" box on the student's application page.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FIELDS.filter((field) => "student" in field).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type="date"
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={NOTICE_KEY}>Please note</Label>
            <Textarea
              id={NOTICE_KEY}
              rows={3}
              maxLength={2000}
              placeholder="One point per line, e.g. Bring your original transcript to the interview."
              value={values[NOTICE_KEY] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [NOTICE_KEY]: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSaving}>
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
