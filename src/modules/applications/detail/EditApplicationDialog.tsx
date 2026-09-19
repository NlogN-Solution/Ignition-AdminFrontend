import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IntakePicker } from "@/modules/academic/pickers";
import { useCreateIntake } from "@/modules/academic/hooks";
import { useAuthStore } from "@/services/authStore";
import { UserRole } from "@/types/enums";
import type { ApplicationRead, ApplicationUpdatePayload } from "@/modules/applications/types";

/**
 * The editable facts of an application — one list, all of it shown to the
 * student.
 *
 * It used to be two groups: a general block and a "Shown to the student" block
 * with a condition deadline and a free-text notice. Everything here reaches the
 * student portal one way or another (the progress tracker's dates, Key
 * Deadlines, Course Details), so the split said nothing useful, and the
 * condition deadline and notice were rarely filled in. They are no longer
 * edited here; values already saved are left untouched, because only the
 * fields below are sent.
 *
 * Intake and study mode are the two student-facing facts that had no staff
 * control at all. Intakes belong to the course: anyone who can edit the
 * application picks one, and admins — who own the catalogue, and are the only
 * role the API lets create intakes — can add a missing one without leaving
 * the dialog. Study mode is per application ("Part-time" for this student),
 * not an edit to the course everyone else is on.
 *
 * Cleared inputs go out as `null`, never `""`: the API distinguishes "not set"
 * from an empty string, and an empty string is what a date input gives you when
 * someone deletes the value.
 */

const FIELDS = [
  { key: "application_deadline", label: "Application deadline", type: "date" },
  { key: "submission_date", label: "Submission date", type: "date" },
  { key: "offer_received_date", label: "Offer received", type: "date" },
  { key: "visa_applied_date", label: "Visa applied", type: "date" },
  { key: "visa_decision_date", label: "Visa decision", type: "date" },
  { key: "enrollment_date", label: "Enrolment date", type: "date" },
  { key: "payment_deadline", label: "Payment deadline", type: "date" },
  { key: "tuition_fee", label: "Tuition fee (per year)", type: "number" },
  { key: "scholarship_amount", label: "Scholarship", type: "number" },
  { key: "university_application_id", label: "University reference", type: "text" },
] as const;

const STUDY_MODES = ["Full-time", "Part-time", "Online", "Blended", "Distance learning"];

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
  const role = useAuthStore((s) => s.user?.role);
  const canCreateIntake = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  const createIntake = useCreateIntake();

  const [values, setValues] = useState<Record<string, string>>({});
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState("");
  const [newIntakeOpen, setNewIntakeOpen] = useState(false);
  const [newIntake, setNewIntake] = useState({ name: "", start_date: "", application_deadline: "" });

  // Reset from the record each time the dialog opens, so a cancelled edit does
  // not leak into the next one.
  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const field of FIELDS) {
      const raw = application[field.key as keyof ApplicationRead];
      next[field.key] = raw === null || raw === undefined ? "" : String(raw).slice(0, field.type === "date" ? 10 : undefined);
    }
    setValues(next);
    setIntakeId(application.intake_id);
    setStudyMode(application.study_mode ?? "");
    setNewIntakeOpen(false);
    setNewIntake({ name: "", start_date: "", application_deadline: "" });
  }, [open, application]);

  async function addIntake() {
    const created = await createIntake.mutateAsync({
      program_id: application.program_id,
      name: newIntake.name.trim(),
      start_date: newIntake.start_date || null,
      application_deadline: newIntake.application_deadline || null,
    });
    setIntakeId(created.id);
    setNewIntakeOpen(false);
    setNewIntake({ name: "", start_date: "", application_deadline: "" });
  }

  function submit() {
    const payload: Record<string, unknown> = {};
    for (const field of FIELDS) {
      const raw = values[field.key]?.trim() ?? "";
      payload[field.key] = raw === "" ? null : field.type === "number" ? Number(raw) : raw;
    }
    payload.intake_id = intakeId;
    payload.study_mode = studyMode.trim() === "" ? null : studyMode.trim();
    onSave(payload as ApplicationUpdatePayload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit application</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">Everything here is shown to the student on their application page.</p>
        </DialogHeader>

        {/* Intake + study mode first: they describe the course the student is on. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Intake</Label>
              {canCreateIntake && !newIntakeOpen && (
                <button
                  type="button"
                  onClick={() => setNewIntakeOpen(true)}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> New intake
                </button>
              )}
            </div>
            <IntakePicker value={intakeId} onChange={setIntakeId} programId={application.program_id} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="study_mode">Study mode</Label>
            <Input
              id="study_mode"
              list="study-mode-options"
              maxLength={50}
              placeholder="Uses the course's own if blank"
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value)}
            />
            <datalist id="study-mode-options">
              {STUDY_MODES.map((mode) => (
                <option key={mode} value={mode} />
              ))}
            </datalist>
          </div>
        </div>

        {newIntakeOpen && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[12.5px] font-medium">New intake for this course</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="intake_name">Name</Label>
                <Input
                  id="intake_name"
                  maxLength={50}
                  placeholder="January 2027"
                  value={newIntake.name}
                  onChange={(e) => setNewIntake((v) => ({ ...v, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake_start">Starts</Label>
                <Input
                  id="intake_start"
                  type="date"
                  value={newIntake.start_date}
                  onChange={(e) => setNewIntake((v) => ({ ...v, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake_deadline">Apply by</Label>
                <Input
                  id="intake_deadline"
                  type="date"
                  value={newIntake.application_deadline}
                  onChange={(e) => setNewIntake((v) => ({ ...v, application_deadline: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setNewIntakeOpen(false)} disabled={createIntake.isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={addIntake} disabled={!newIntake.name.trim() || createIntake.isPending}>
                {createIntake.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add and select
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
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
