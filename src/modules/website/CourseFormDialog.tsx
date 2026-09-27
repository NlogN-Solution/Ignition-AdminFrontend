import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateWebsiteCourse, useWebsiteUniversities } from "./hooks";
import { COURSE_LEVELS, COURSE_SUBJECTS, type WebsiteProgramPayload } from "./types";

/** A course that has not been saved yet — what the new-university form collects. */
export type CourseDraft = WebsiteProgramPayload & { name: string };

const EMPTY: CourseDraft = {
  name: "",
  qualification: "",
  subject: null,
  course_level: null,
  duration_years: null,
  campus: "",
  fee_tier: "",
  slug: "",
  extra_requirements: "",
  placement: false,
  is_published: false,
  is_active: true,
};

/** Blank strings go to the API as null, the way the course editor saves them. */
const clean = (draft: CourseDraft): CourseDraft => ({
  ...draft,
  name: draft.name.trim(),
  qualification: draft.qualification?.trim() || null,
  campus: draft.campus?.trim() || null,
  fee_tier: draft.fee_tier?.trim() || null,
  slug: draft.slug?.trim() || null,
  extra_requirements: draft.extra_requirements?.trim() || null,
});

/**
 * Add a course — the same fields as the course's own page.
 *
 * Two modes. With `onDraft`, nothing is saved: the course is handed back to
 * the new-university form, which creates it once the university exists. Without
 * it the course is created straight away, against `universityId` or, when that
 * is not given (the flat Courses list), against the university picked here.
 */
export function CourseFormDialog({
  open,
  onOpenChange,
  universityId,
  onDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityId?: string;
  onDraft?: (draft: CourseDraft) => void;
}) {
  const [form, setForm] = useState<CourseDraft>(EMPTY);
  const [pickedUniversity, setPickedUniversity] = useState<string | undefined>(universityId);
  const [error, setError] = useState("");
  const create = useCreateWebsiteCourse();
  const needsUniversity = !onDraft && !universityId;
  const { data: universities } = useWebsiteUniversities({ limit: 200 });

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setPickedUniversity(universityId);
      setError("");
    }
  }, [open, universityId]);

  const set = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = () => {
    if (!form.name.trim()) {
      setError("Enter the course title.");
      return;
    }
    const draft = clean(form);
    if (onDraft) {
      onDraft(draft);
      onOpenChange(false);
      return;
    }
    const target = universityId ?? pickedUniversity;
    if (!target) {
      setError("Choose the university that teaches this course.");
      return;
    }
    create.mutate({ ...draft, university_id: target }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add course</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {needsUniversity && (
            <Field label="University" className="sm:col-span-2">
              <Select value={pickedUniversity} onValueChange={setPickedUniversity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select university…" />
                </SelectTrigger>
                <SelectContent>
                  {(universities?.items ?? []).map((university) => (
                    <SelectItem key={university.id} value={university.id}>
                      {university.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Title *">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Computer Science" />
          </Field>
          <Field label="Qualification" hint="As the university writes it — BSc (Hons), MSc.">
            <Input value={form.qualification ?? ""} onChange={(e) => set("qualification", e.target.value)} />
          </Field>
          <Field label="Subject">
            <Select value={form.subject ?? undefined} onValueChange={(value) => set("subject", value as CourseDraft["subject"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Level">
            <Select
              value={form.course_level ?? undefined}
              onValueChange={(value) => set("course_level", value as CourseDraft["course_level"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level…" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Duration, in years">
            <Input
              inputMode="decimal"
              value={form.duration_years ?? ""}
              onChange={(e) => set("duration_years", e.target.value === "" ? null : Number(e.target.value))}
            />
          </Field>
          <Field label="Campus">
            <Input value={form.campus ?? ""} onChange={(e) => set("campus", e.target.value)} />
          </Field>
          <Field label="Fee tier">
            <Input value={form.fee_tier ?? ""} onChange={(e) => set("fee_tier", e.target.value)} />
          </Field>
          <Field label="Slug" hint="The public URL segment. Leave blank to set it later.">
            <Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label="Extra requirements" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.extra_requirements ?? ""}
              onChange={(e) => set("extra_requirements", e.target.value)}
            />
          </Field>
          <Toggle label="Includes a placement year" checked={Boolean(form.placement)} onChange={(v) => set("placement", v)} />
          <Toggle label="Published on the public site" checked={Boolean(form.is_published)} onChange={(v) => set("is_published", v)} />
          <Toggle label="Active (selectable in applications)" checked={Boolean(form.is_active)} onChange={(v) => set("is_active", v)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={create.isPending} onClick={submit}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {onDraft ? "Add to list" : "Add course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="pr-4 text-[13px] font-medium text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
