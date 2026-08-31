import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, BookOpen, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useDeleteWebsiteCourse,
  useUpdateWebsiteCourse,
  useWebsiteCourse,
  useWebsiteUniversities,
} from "@/modules/website/hooks";
import { COURSE_LEVELS, COURSE_SUBJECTS, type WebsiteProgramPayload } from "@/modules/website/types";

/**
 * One offering, viewed and edited on its own page.
 *
 * The list is the wrong place to edit one of these: it is server-paginated
 * over ~4,800 rows, and the fields that matter most — the subject a classifier
 * guessed, the duration, the campus — are exactly the ones that need reading
 * beside each other rather than through a row. The bulk bar on the list still
 * handles the classification backlog, which is a different job done at a
 * different scale.
 */
export function WebsiteCourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { data: course, isLoading } = useWebsiteCourse(courseId);
  const { data: universities } = useWebsiteUniversities({ limit: 100 });
  const update = useUpdateWebsiteCourse();
  const remove = useDeleteWebsiteCourse();

  const [form, setForm] = useState<WebsiteProgramPayload>({});
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!course) return;
    setForm({
      name: course.name,
      slug: course.slug,
      qualification: course.qualification,
      subject: course.subject,
      course_level: course.course_level,
      duration_years: course.duration_years,
      placement: course.placement,
      campus: course.campus,
      fee_tier: course.fee_tier,
      extra_requirements: course.extra_requirements,
      is_published: course.is_published,
      is_active: course.is_active,
    });
  }, [course]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-[50vh] w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <EmptyState icon={BookOpen} title="Course not found" description="It may have been deleted." />
    );
  }

  const set = <K extends keyof WebsiteProgramPayload>(key: K, value: WebsiteProgramPayload[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const university = (universities?.items ?? []).find((item) => item.id === course.university_id);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
        onClick={() => navigate("/website/courses")}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to courses
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
              {course.name}
            </h1>
            <Badge variant={course.is_published ? "default" : "secondary"}>
              {course.is_published ? "Published" : "Draft"}
            </Badge>
            {!course.subject && <Badge variant="outline">Unclassified</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {university ? (
              <Link
                to={`/website/universities/${course.university_id}`}
                className="font-medium hover:underline"
              >
                {university.name}
              </Link>
            ) : (
              "Unknown university"
            )}
            {course.slug ? <span className="font-mono"> · {course.slug}</span> : null}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-foreground">Course</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Qualification" hint="As the university writes it — BSc (Hons), MSc.">
              <Input
                value={form.qualification ?? ""}
                onChange={(e) => set("qualification", e.target.value)}
              />
            </Field>
            <Field label="Subject" hint="Guessed from the title on import — confirm it.">
              <Select
                value={form.subject ?? undefined}
                onValueChange={(value) => set("subject", value as typeof form.subject)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unclassified" />
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
                onValueChange={(value) => set("course_level", value as typeof form.course_level)}
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
                onChange={(e) =>
                  set("duration_years", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </Field>
            <Field label="Campus" hint="Where it is taught, if not the main campus.">
              <Input value={form.campus ?? ""} onChange={(e) => set("campus", e.target.value)} />
            </Field>
            <Field label="Fee tier">
              <Input value={form.fee_tier ?? ""} onChange={(e) => set("fee_tier", e.target.value)} />
            </Field>
            <Field label="Slug">
              <Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Extra requirements" hint="Anything this course asks for beyond the university's own entry criteria.">
              <Textarea
                rows={3}
                value={form.extra_requirements ?? ""}
                onChange={(e) => set("extra_requirements", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-foreground">Visibility</h2>
          <div className="space-y-3">
            <Toggle
              label="Published"
              hint="Appears in the public course explorer."
              checked={Boolean(form.is_published)}
              onChange={(value) => set("is_published", value)}
            />
            <Toggle
              label="Active"
              hint="Selectable by counsellors when opening an application. Separate from published."
              checked={Boolean(form.is_active)}
              onChange={(value) => set("is_active", value)}
            />
          </div>
        </section>

        <div className="sticky bottom-0 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur">
          <Button
            disabled={update.isPending}
            onClick={() => update.mutate({ id: course.id, payload: form })}
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this course?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{course.name}&rdquo; is removed from the catalogue and from the public course
            explorer. Applications already opened against it are not affected. This cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(course.id, { onSuccess: () => navigate("/website/courses") })
              }
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="min-w-0 pr-4">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
