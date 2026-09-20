import { useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateIntake, useDeleteIntake, useIntakes, useUpdateIntake } from "./hooks";
import type { IntakePayload, IntakeRead } from "./types";

/**
 * The intakes a course runs, on the course's own page.
 *
 * `intakes` has had a full CRUD API since the port and nothing in the console
 * ever rendered it, so the only way an intake came into existence was the
 * catalogue importer — which meant an application could be opened against an
 * intake nobody could add, rename, re-date or retire. This is that screen.
 *
 * Two things it deliberately is not:
 *
 * - **Not the university's `intakes_summary`.** That field is display copy on
 *   the public page ("Feb / Jul"); these are the queryable records an
 *   application's `intake_id` points at. Editing one does not change the other,
 *   and conflating them would make the public page lie the first time an intake
 *   was retired.
 * - **Not a delete you can take back.** `applications.intake_id` references
 *   these rows, so removing one is confirmed rather than one-click — and
 *   retiring an intake you no longer take students for is what the Active
 *   switch is for.
 */
export function CourseIntakes({ programId }: { programId: string }) {
  const { data, isLoading } = useIntakes({ program_id: programId, limit: 100 });
  const remove = useDeleteIntake();
  const [editing, setEditing] = useState<IntakeRead | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState<IntakeRead | null>(null);

  const intakes = data?.items ?? [];

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">Intakes</h2>
          <p className="text-xs text-muted-foreground">
            When this course starts, and the last day to apply for each start. A counsellor picks one of
            these when opening an application.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Add intake
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : intakes.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          <CalendarClock className="h-4 w-4 shrink-0" />
          No intakes yet. Until one exists, an application against this course cannot record which start
          it is for.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {intakes.map((intake) => (
            <li key={intake.id} className="flex flex-wrap items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => setEditing(intake)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[13px] font-medium text-foreground">
                  {intake.name}
                  {!intake.is_active && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(retired)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {intake.start_date ? `Starts ${formatDay(intake.start_date)}` : "No start date"}
                  {" · "}
                  {intake.application_deadline
                    ? `apply by ${formatDay(intake.application_deadline)}`
                    : "no deadline set"}
                </p>
              </button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(intake)}>
                Edit
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                aria-label={`Remove ${intake.name}`}
                onClick={() => setConfirming(intake)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <IntakeDialog
        programId={programId}
        intake={editing}
        open={adding || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAdding(false);
            setEditing(null);
          }
        }}
      />

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {confirming?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Applications already opened against this intake keep their other details but lose which start
            they were for. If you have simply stopped taking students for it, turn <strong>Active</strong>{" "}
            off instead — that keeps the history and takes it off the counsellor&rsquo;s list.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={remove.isPending}
              onClick={() =>
                confirming &&
                remove.mutate(confirming.id, { onSuccess: () => setConfirming(null) })
              }
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove intake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function IntakeDialog({
  programId,
  intake,
  open,
  onOpenChange,
}: {
  programId: string;
  intake: IntakeRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateIntake();
  const update = useUpdateIntake();
  const [form, setForm] = useState<IntakePayload>(blank(programId));

  // Keyed on the intake, so opening the dialog seeds it from whichever row was
  // clicked — and closing it does not leave the last row's dates behind in the
  // "Add intake" form.
  const [seeded, setSeeded] = useState<string | null>(null);
  const key = open ? (intake?.id ?? "new") : null;
  if (key !== seeded) {
    setSeeded(key);
    setForm(intake ? fromIntake(intake) : blank(programId));
  }

  const isPending = create.isPending || update.isPending;
  const set = <K extends keyof IntakePayload>(field: K, value: IntakePayload[K]) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  function save() {
    const payload: IntakePayload = {
      ...form,
      program_id: programId,
      name: form.name.trim(),
      // The API takes a date or null, never "".
      start_date: form.start_date || null,
      application_deadline: form.application_deadline || null,
    };
    if (!payload.name) return;
    const done = { onSuccess: () => onOpenChange(false) };
    if (intake) update.mutate({ id: intake.id, payload }, done);
    else create.mutate(payload, done);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{intake ? `Edit ${intake.name}` : "Add an intake"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="September 2027"
            />
            <p className="text-[11px] text-muted-foreground/80">
              How the university names the start — &ldquo;September 2027&rdquo;, &ldquo;Jan 2028&rdquo;.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Starts</Label>
              <Input
                type="date"
                value={form.start_date ?? ""}
                onChange={(event) => set("start_date", event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Apply by</Label>
              <Input
                type="date"
                value={form.application_deadline ?? ""}
                onChange={(event) => set("application_deadline", event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="min-w-0 pr-4">
              <p className="text-[13px] font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Offered to counsellors opening an application. Turn it off to retire a past intake
                without losing the applications that used it.
              </p>
            </div>
            <Switch
              checked={form.is_active ?? true}
              onCheckedChange={(checked) => set("is_active", checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending || !form.name.trim()} onClick={save}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {intake ? "Save intake" : "Add intake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const blank = (programId: string): IntakePayload => ({
  program_id: programId,
  name: "",
  start_date: "",
  application_deadline: "",
  is_active: true,
});

const fromIntake = (intake: IntakeRead): IntakePayload => ({
  program_id: intake.program_id,
  name: intake.name,
  // `<input type="date">` wants `YYYY-MM-DD`; the API already sends that.
  start_date: intake.start_date ?? "",
  application_deadline: intake.application_deadline ?? "",
  is_active: intake.is_active,
});

const formatDay = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
