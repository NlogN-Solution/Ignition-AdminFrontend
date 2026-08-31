import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RequirementsMatrix } from "./RequirementsMatrix";
import { useUpdateWebsiteUniversity } from "./hooks";
import { UK_REGIONS, type WebsiteUniversity, type WebsiteUniversityPayload } from "./types";

/**
 * The four fields the public site's `University` type declares non-optional.
 * A published record missing one of them is a runtime hole on the live site,
 * not a hidden section — so publishing is gated on them here and in the
 * backend service, not merely discouraged.
 */
const PUBLISH_REQUIRED = ["slug", "name", "city", "region", "tagline", "overview"] as const;

const schema = z.object({
  slug: z.string().optional(),
  name: z.string().min(1, "Required"),
  city: z.string().optional(),
  region: z.string().optional(),
  monogram: z.string().max(3, "Three characters at most").optional(),
  kind: z.string().optional(),
  founded: z.string().optional(),
  website: z.string().optional(),
  logo_url: z.string().optional(),

  tagline: z.string().optional(),
  overview: z.string().optional(),
  student_experience: z.string().optional(),
  careers_text: z.string().optional(),

  tuition_min: z.string().optional(),
  tuition_max: z.string().optional(),
  living_cost_monthly: z.string().optional(),
  accommodation_guaranteed: z.boolean().optional(),
  accommodation_weekly_from: z.string().optional(),
  accommodation_weekly_to: z.string().optional(),
  accommodation_note: z.string().optional(),

  entry_typical: z.string().optional(),
  entry_english: z.string().optional(),
  entry_tariff: z.string().optional(),
  entry_ielts: z.string().optional(),

  campus: z.string().optional(),
  student_population: z.string().optional(),
  international_students: z.string().optional(),
  student_staff_ratio: z.string().optional(),
  placement_year: z.boolean().optional(),
  facilities: z.array(z.object({ value: z.string() })),
  international_support: z.array(z.object({ value: z.string() })),

  employed_rate: z.string().optional(),
  employed_source: z.string().optional(),
  median_salary: z.string().optional(),
  placement_rate: z.string().optional(),
  employers: z.array(z.object({ name: z.string(), sector: z.string().optional() })),
  services: z.array(z.object({ value: z.string() })),

  rankings: z.array(
    z.object({
      title: z.string(),
      position: z.string().optional(),
      source: z.string(),
      year: z.string(),
    }),
  ),
  awards: z.array(z.object({ title: z.string(), organisation: z.string(), year: z.string() })),
  milestones: z.array(z.object({ year: z.string(), label: z.string() })),
  history: z.array(z.object({ value: z.string() })),

  hero_image: z.string().optional(),
  card_image: z.string().optional(),
  flyer_url: z.string().optional(),

  is_published: z.boolean(),
  is_example: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const toList = (values: string[] | null | undefined) => (values ?? []).map((value) => ({ value }));
const fromList = (values: { value: string }[]) => {
  const cleaned = values.map((item) => item.value.trim()).filter(Boolean);
  return cleaned.length ? cleaned : null;
};
const num = (value: string | undefined) => {
  const parsed = Number(value);
  return value && !Number.isNaN(parsed) ? parsed : null;
};
const str = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

function toForm(university: WebsiteUniversity): FormValues {
  return {
    slug: university.slug ?? "",
    name: university.name,
    city: university.city ?? "",
    region: university.region ?? "",
    monogram: university.monogram ?? "",
    kind: university.kind ?? "",
    founded: university.founded ?? "",
    website: university.website ?? "",
    logo_url: university.logo_url ?? "",
    tagline: university.tagline ?? "",
    overview: university.overview ?? "",
    student_experience: university.student_experience ?? "",
    careers_text: university.careers_text ?? "",
    tuition_min: str(university.tuition_min),
    tuition_max: str(university.tuition_max),
    living_cost_monthly: str(university.living_cost_monthly),
    accommodation_guaranteed: university.accommodation?.guaranteed ?? false,
    accommodation_weekly_from: str(university.accommodation?.weeklyFrom),
    accommodation_weekly_to: str(university.accommodation?.weeklyTo),
    accommodation_note: university.accommodation?.note ?? "",
    entry_typical: university.entry?.typical ?? "",
    entry_english: university.entry?.english ?? "",
    entry_tariff: university.entry?.tariff ?? "",
    entry_ielts: university.entry?.ielts ?? "",
    campus: university.campus ?? "",
    student_population: university.student_population ?? "",
    international_students: university.international_students ?? "",
    student_staff_ratio: university.student_staff_ratio ?? "",
    placement_year: university.placement_year,
    facilities: toList(university.facilities),
    international_support: toList(university.international_support),
    employed_rate: university.employability?.employedRate ?? "",
    employed_source: university.employability?.employedSource ?? "",
    median_salary: university.employability?.medianSalary ?? "",
    placement_rate: university.employability?.placementRate ?? "",
    employers: (university.employability?.employers ?? []).map((e) => ({ name: e.name, sector: e.sector ?? "" })),
    services: toList(university.employability?.services),
    rankings: (university.rankings ?? []).map((r) => ({
      title: r.title,
      position: r.position ?? "",
      source: r.source,
      year: String(r.year ?? ""),
    })),
    awards: (university.awards ?? []).map((a) => ({
      title: a.title,
      organisation: a.organisation,
      year: String(a.year ?? ""),
    })),
    milestones: university.milestones ?? [],
    history: toList(university.history),
    hero_image: university.imagery?.hero ?? "",
    card_image: university.imagery?.card ?? "",
    flyer_url: university.flyer_url ?? "",
    is_published: university.is_published,
    is_example: university.is_example,
    is_active: university.is_active,
  };
}

function toPayload(values: FormValues): WebsiteUniversityPayload {
  const employers = values.employers.filter((e) => e.name.trim());
  const services = fromList(values.services);
  const employability =
    values.employed_rate || values.median_salary || employers.length || services
      ? {
          employedRate: values.employed_rate || undefined,
          employedSource: values.employed_source || undefined,
          medianSalary: values.median_salary || undefined,
          placementRate: values.placement_rate || undefined,
          employers: employers.map((e) => ({ name: e.name, sector: e.sector || undefined })),
          services: services ?? [],
        }
      : null;

  const accommodation =
    values.accommodation_guaranteed || values.accommodation_weekly_from || values.accommodation_note
      ? {
          guaranteed: values.accommodation_guaranteed,
          weeklyFrom: num(values.accommodation_weekly_from) ?? undefined,
          weeklyTo: num(values.accommodation_weekly_to) ?? undefined,
          note: values.accommodation_note || undefined,
        }
      : null;

  const entry =
    values.entry_typical || values.entry_english || values.entry_tariff || values.entry_ielts
      ? {
          typical: values.entry_typical || undefined,
          english: values.entry_english || undefined,
          tariff: values.entry_tariff || undefined,
          ielts: values.entry_ielts || undefined,
        }
      : null;

  const imagery =
    values.hero_image || values.card_image ? { hero: values.hero_image || undefined, card: values.card_image || undefined } : null;

  return {
    slug: values.slug || null,
    name: values.name,
    city: values.city || null,
    region: (values.region || null) as WebsiteUniversityPayload["region"],
    monogram: values.monogram || null,
    kind: values.kind || null,
    founded: values.founded || null,
    website: values.website || null,
    logo_url: values.logo_url || null,
    tagline: values.tagline || null,
    overview: values.overview || null,
    student_experience: values.student_experience || null,
    careers_text: values.careers_text || null,
    tuition_min: num(values.tuition_min),
    tuition_max: num(values.tuition_max),
    living_cost_monthly: num(values.living_cost_monthly),
    accommodation,
    entry,
    campus: values.campus || null,
    student_population: values.student_population || null,
    international_students: values.international_students || null,
    student_staff_ratio: values.student_staff_ratio || null,
    placement_year: values.placement_year ?? false,
    facilities: fromList(values.facilities),
    international_support: fromList(values.international_support),
    employability,
    rankings: values.rankings.filter((r) => r.title.trim()).map((r) => ({
      title: r.title,
      position: r.position || undefined,
      source: r.source,
      year: Number(r.year) || new Date().getFullYear(),
    })),
    awards: values.awards.filter((a) => a.title.trim()).map((a) => ({
      title: a.title,
      organisation: a.organisation,
      year: Number(a.year) || new Date().getFullYear(),
    })),
    milestones: values.milestones.filter((m) => m.label.trim()),
    history: fromList(values.history),
    imagery,
    flyer_url: values.flyer_url || null,
    is_published: values.is_published,
    is_example: values.is_example,
    is_active: values.is_active,
  };
}

/**
 * Which tabs still have nothing in them.
 *
 * Given the hide-when-absent contract, an empty tab is *exactly* a section the
 * public page is not rendering. Showing that is the difference between "the
 * site looks thin" and "here is why the site looks thin".
 */
function useCompleteness(values: FormValues) {
  return useMemo(() => {
    const filled = (...items: unknown[]) => items.some((item) => (Array.isArray(item) ? item.length > 0 : Boolean(item)));
    return {
      identity: filled(values.slug, values.city, values.region, values.monogram),
      overview: filled(values.tagline, values.overview, values.student_experience, values.careers_text),
      money: filled(values.tuition_min, values.tuition_max, values.living_cost_monthly, values.accommodation_note),
      entry: filled(values.entry_typical, values.entry_english, values.entry_tariff, values.entry_ielts),
      life: filled(values.facilities, values.international_support, values.campus, values.student_population),
      outcomes: filled(values.employed_rate, values.median_salary, values.employers, values.services),
      reputation: filled(values.rankings, values.awards, values.milestones, values.history),
      media: filled(values.hero_image, values.card_image, values.flyer_url, values.logo_url),
    };
  }, [values]);
}

function TabLabel({ label, complete }: { label: string; complete: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <span
        aria-label={complete ? "has content" : "empty — this section will not render"}
        className={cn("h-1.5 w-1.5 rounded-full", complete ? "bg-emerald-500" : "bg-muted-foreground/40")}
      />
    </span>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** A repeating list of plain strings — facilities, services, history. */
function StringList({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<FormValues>;
  name: "facilities" | "international_support" | "services" | "history";
  label: string;
  placeholder: string;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Controller
            control={control}
            name={`${name}.${index}.value`}
            render={({ field: input }) => <Input {...input} placeholder={placeholder} />}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

/**
 * The full record, edited in place on the university's own page.
 *
 * **This used to be a sheet opened from the list row, and that was the
 * problem.** Ten tabs of a forty-field record inside a 768px drawer meant
 * every repeating group — rankings, awards, milestones, employers — wrapped
 * onto two lines per row, and the requirements matrix, which is a grid of
 * routes across and criteria down, had nowhere to be a grid. The record is
 * the width of a page; it now gets one.
 *
 * The component keeps the tabs, because the record really does have ten
 * sections and the completeness dots on them are the fastest way to see which
 * parts of the public page are still empty. What it no longer keeps is a
 * cancel button — there is nothing to close, and navigating away is the
 * cancel.
 */
export function UniversityEditor({ university }: { university: WebsiteUniversity }) {
  const update = useUpdateWebsiteUniversity(university?.id ?? "");
  /**
   * Seeded synchronously from the record, not by a `reset` in an effect.
   *
   * That distinction is load-bearing for the two `Select` fields. Radix reads
   * a `value` of `undefined` as "uncontrolled" and then keeps its own internal
   * state for the rest of its life — so a select whose value only arrives on
   * the second render never displays it, and never displays anything the user
   * picks either. The record is already loaded before this component mounts
   * (its page does not render the editor until it is), so there is no reason
   * for the first render to be empty.
   */
  const { register, handleSubmit, control, reset, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toForm(university),
  });

  // Re-seed only when the record itself is replaced — a save round-trip, or a
  // refetch after an import.
  useEffect(() => {
    reset(toForm(university));
  }, [university, reset]);

  const values = watch();
  const completeness = useCompleteness(values);

  const rankings = useFieldArray({ control, name: "rankings" });
  const awards = useFieldArray({ control, name: "awards" });
  const milestones = useFieldArray({ control, name: "milestones" });
  const employers = useFieldArray({ control, name: "employers" });

  const missingForPublish = PUBLISH_REQUIRED.filter((key) => !String(values[key as keyof FormValues] ?? "").trim());
  const canPublish = missingForPublish.length === 0;

  const onSubmit = (form: FormValues) => {
    update.mutate(toPayload(form));
  };

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        Tabs mirror the public page&rsquo;s own sections. A grey dot means the section is empty &mdash; and an
        empty section is one the live page does not render at all.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="identity">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="identity"><TabLabel label="Identity" complete={completeness.identity} /></TabsTrigger>
              <TabsTrigger value="overview"><TabLabel label="Overview" complete={completeness.overview} /></TabsTrigger>
              <TabsTrigger value="money"><TabLabel label="Money" complete={completeness.money} /></TabsTrigger>
              <TabsTrigger value="entry"><TabLabel label="Entry" complete={completeness.entry} /></TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="life"><TabLabel label="Life" complete={completeness.life} /></TabsTrigger>
              <TabsTrigger value="outcomes"><TabLabel label="Outcomes" complete={completeness.outcomes} /></TabsTrigger>
              <TabsTrigger value="reputation"><TabLabel label="Reputation" complete={completeness.reputation} /></TabsTrigger>
              <TabsTrigger value="media"><TabLabel label="Media" complete={completeness.media} /></TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><Input {...register("name")} /></Field>
                <Field label="Slug" hint="The public URL segment. Also what the research handoff carries.">
                  <Input {...register("slug")} placeholder="york-st-john" />
                </Field>
                <Field label="City"><Input {...register("city")} /></Field>
                <Field label="Region" hint="Proposed from the city on import — confirm it.">
                  <Controller
                    control={control}
                    name="region"
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select region…" /></SelectTrigger>
                        <SelectContent>
                          {UK_REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="Monogram" hint="Up to three letters, used where there is no logo.">
                  <Input {...register("monogram")} maxLength={3} placeholder="YSJ" />
                </Field>
                <Field label="Kind"><Input {...register("kind")} placeholder="Public university" /></Field>
                <Field label="Founded"><Input {...register("founded")} placeholder="1841" /></Field>
                <Field label="Website"><Input {...register("website")} placeholder="https://…" /></Field>
              </div>
              {formState.errors.name && <p className="text-sm text-destructive">{formState.errors.name.message}</p>}
            </TabsContent>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <Field label="Tagline" hint="One line. Required before publishing.">
                <Input {...register("tagline")} />
              </Field>
              <Field label="Overview" hint="Required before publishing.">
                <Textarea rows={5} {...register("overview")} />
              </Field>
              <Field label="Student experience"><Textarea rows={4} {...register("student_experience")} /></Field>
              <Field label="Careers"><Textarea rows={4} {...register("careers_text")} /></Field>
            </TabsContent>

            <TabsContent value="money" className="space-y-4 pt-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 text-amber-500" />
                Fee figures extracted from the workbook are a <strong>proposal</strong>, never applied
                automatically. The fee prose on each entry route stays authoritative.
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Tuition from (£)"><Input {...register("tuition_min")} inputMode="numeric" /></Field>
                <Field label="Tuition to (£)"><Input {...register("tuition_max")} inputMode="numeric" /></Field>
                <Field label="Living cost / month (£)"><Input {...register("living_cost_monthly")} inputMode="numeric" /></Field>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name="accommodation_guaranteed"
                  render={({ field }) => <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />}
                />
                <Label>Accommodation guaranteed for first-year internationals</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Weekly from (£)"><Input {...register("accommodation_weekly_from")} inputMode="numeric" /></Field>
                <Field label="Weekly to (£)"><Input {...register("accommodation_weekly_to")} inputMode="numeric" /></Field>
              </div>
              <Field label="Accommodation note"><Textarea rows={2} {...register("accommodation_note")} /></Field>
            </TabsContent>

            <TabsContent value="entry" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                The headline entry profile shown on the university page. Per-route criteria — the real
                requirements matrix from the workbook — live on the Routes tab.
              </p>
              <Field label="Typical offer"><Input {...register("entry_typical")} /></Field>
              <Field label="English requirement"><Input {...register("entry_english")} /></Field>
              <Field label="UCAS tariff"><Input {...register("entry_tariff")} /></Field>
              <Field label="IELTS"><Input {...register("entry_ielts")} /></Field>
            </TabsContent>

            <TabsContent value="routes" className="pt-4">
              <RequirementsMatrix universityId={university.id} />
            </TabsContent>

            <TabsContent value="life" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Campus"><Input {...register("campus")} /></Field>
                <Field label="Student population"><Input {...register("student_population")} /></Field>
                <Field label="International students"><Input {...register("international_students")} /></Field>
                <Field label="Student:staff ratio"><Input {...register("student_staff_ratio")} /></Field>
              </div>
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name="placement_year"
                  render={({ field }) => <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />}
                />
                <Label>Offers placement years</Label>
              </div>
              <Separator />
              <StringList control={control} name="facilities" label="Facilities" placeholder="Library open 24/7" />
              <StringList
                control={control}
                name="international_support"
                label="International support"
                placeholder="Airport pickup"
              />
            </TabsContent>

            <TabsContent value="outcomes" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="In work or study 15 months on"><Input {...register("employed_rate")} placeholder="94%" /></Field>
                <Field label="Source" hint="A figure without a source is a rumour.">
                  <Input {...register("employed_source")} placeholder="Graduate Outcomes 2024" />
                </Field>
                <Field label="Median salary"><Input {...register("median_salary")} placeholder="£26,000" /></Field>
                <Field label="Placement rate"><Input {...register("placement_rate")} /></Field>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Employers</Label>
                {employers.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input {...register(`employers.${index}.name`)} placeholder="NHS" />
                    <Input {...register(`employers.${index}.sector`)} placeholder="Healthcare" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => employers.remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => employers.append({ name: "", sector: "" })}>
                  <Plus className="h-3.5 w-3.5" /> Add employer
                </Button>
              </div>
              <StringList control={control} name="services" label="Careers services" placeholder="CV clinic" />
            </TabsContent>

            <TabsContent value="reputation" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Rankings</Label>
                {rankings.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_100px_1fr_80px_auto] gap-2">
                    <Input {...register(`rankings.${index}.title`)} placeholder="University of the Year" />
                    <Input {...register(`rankings.${index}.position`)} placeholder="1st" />
                    <Input {...register(`rankings.${index}.source`)} placeholder="The Times" />
                    <Input {...register(`rankings.${index}.year`)} placeholder="2026" inputMode="numeric" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => rankings.remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rankings.append({ title: "", position: "", source: "", year: "" })}
                >
                  <Plus className="h-3.5 w-3.5" /> Add ranking
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Awards</Label>
                {awards.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_80px_auto] gap-2">
                    <Input {...register(`awards.${index}.title`)} placeholder="Gold" />
                    <Input {...register(`awards.${index}.organisation`)} placeholder="TEF" />
                    <Input {...register(`awards.${index}.year`)} placeholder="2026" inputMode="numeric" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => awards.remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => awards.append({ title: "", organisation: "", year: "" })}
                >
                  <Plus className="h-3.5 w-3.5" /> Add award
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Milestones</Label>
                {milestones.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[100px_1fr_auto] gap-2">
                    <Input {...register(`milestones.${index}.year`)} placeholder="1841" />
                    <Input {...register(`milestones.${index}.label`)} placeholder="Founded as a teacher training college" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => milestones.remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => milestones.append({ year: "", label: "" })}>
                  <Plus className="h-3.5 w-3.5" /> Add milestone
                </Button>
              </div>
              <Separator />
              <StringList control={control} name="history" label="History" placeholder="A paragraph of history" />
            </TabsContent>

            <TabsContent value="media" className="space-y-4 pt-4">
              <Field label="Logo URL"><Input {...register("logo_url")} placeholder="https://…" /></Field>
              <Field label="Hero image URL"><Input {...register("hero_image")} placeholder="https://…" /></Field>
              <Field label="Card image URL"><Input {...register("card_image")} placeholder="https://…" /></Field>
              <Field label="Flyer" hint="The PDF the workbook links to.">
                <Input {...register("flyer_url")} placeholder="https://…" />
              </Field>
              <p className="text-xs text-muted-foreground">
                Upload files on the Media page, then paste the URL here.
              </p>
            </TabsContent>

            <TabsContent value="publish" className="space-y-4 pt-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Published on the public site</Label>
                    <p className="text-xs text-muted-foreground">
                      Separate from “active”. Active means selectable in an application; published means
                      visible to visitors.
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="is_published"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        disabled={!canPublish && !field.value}
                        onCheckedChange={(checked) => {
                          if (checked && !canPublish) return;
                          field.onChange(checked);
                        }}
                      />
                    )}
                  />
                </div>
                {!canPublish && (
                  <p className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Cannot publish yet — the public site declares these non-optional, so a missing one is a
                      runtime hole rather than a hidden section: <strong>{missingForPublish.join(", ")}</strong>
                    </span>
                  </p>
                )}
                {canPublish && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500">
                    <Check className="h-3.5 w-3.5" /> Every required field is filled in.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label className="text-sm">Active in the catalogue</Label>
                  <p className="text-xs text-muted-foreground">Selectable by a counsellor opening an application.</p>
                </div>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <Label className="text-sm">Example data</Label>
                  <p className="text-xs text-muted-foreground">
                    Shows the “Example data” badge on the public site. Imported records clear this; anything
                    still invented keeps it.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="is_example"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>

              {values.slug && (
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={`/api/v1/public/universities/${values.slug}`} target="_blank" rel="noreferrer">
                    Preview the public payload
                  </a>
                </Button>
              )}
            </TabsContent>
          </Tabs>

          {/* Sticky, because ten tabs of fields is a long scroll and a save
              button at the bottom of the tallest one is a save button nobody
              finds from the top of another. */}
          <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
    </div>
  );
}

export { PUBLISH_REQUIRED };
