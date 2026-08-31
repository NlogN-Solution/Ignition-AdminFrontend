import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Repeater, str } from "./BlockFields";
import { CONTENT_KINDS, CONTENT_KIND_LABELS, type ContentKind, type ContentPageRead } from "./contentTypes";
import { useCreateContentPage, useUpdateContentPage } from "./contentHooks";

/**
 * Everything about a page except its blocks.
 *
 * `key` is the identifier code refers to (`home.hero`, `guide.visa`) and
 * `slug` is the URL. They are separate because a fragment has a key and no
 * URL at all: it is a named piece of copy a coded page pulls in.
 */

const EMPTY = {
  key: "",
  kind: "page" as ContentKind,
  slug: "",
  title: "",
  excerpt: "",
  tag: "",
  reading_minutes: "",
  display_order: "0",
  hero_eyebrow: "",
  hero_title: "",
  hero_intro: "",
  hero_image: "",
  seo_title: "",
  seo_description: "",
  seo_og_image: "",
  seo_noindex: false,
  source_label: "",
  source_href: "",
  is_published: false,
};

type FormState = typeof EMPTY;

function toForm(page: ContentPageRead): FormState {
  const hero = (page.hero ?? {}) as Record<string, unknown>;
  const seo = (page.seo ?? {}) as Record<string, unknown>;
  return {
    key: page.key,
    kind: page.kind,
    slug: page.slug ?? "",
    title: page.title,
    excerpt: page.excerpt ?? "",
    tag: page.tag ?? "",
    reading_minutes: page.reading_minutes == null ? "" : String(page.reading_minutes),
    display_order: String(page.display_order ?? 0),
    hero_eyebrow: str(hero, "eyebrow"),
    hero_title: str(hero, "title"),
    hero_intro: str(hero, "intro"),
    hero_image: str(hero, "image"),
    seo_title: str(seo, "title"),
    seo_description: str(seo, "description"),
    seo_og_image: str(seo, "ogImage"),
    seo_noindex: Boolean(seo.noindex),
    source_label: page.source?.label ?? "",
    source_href: page.source?.href ?? "",
    is_published: page.is_published,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ContentPageSheet({
  page,
  open,
  onOpenChange,
  defaultKind,
  onCreated,
}: {
  page: ContentPageRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKind?: ContentKind;
  onCreated?: (page: ContentPageRead) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [related, setRelated] = useState<Record<string, unknown>[]>([]);

  const create = useCreateContentPage();
  const update = useUpdateContentPage(page?.id ?? "");

  useEffect(() => {
    if (!open) return;
    setForm(page ? toForm(page) : { ...EMPTY, kind: defaultKind ?? "page" });
    setRelated(page?.related ? (page.related as Record<string, unknown>[]) : []);
  }, [open, page, defaultKind]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isPending = create.isPending || update.isPending;

  function payload() {
    const hero = {
      eyebrow: form.hero_eyebrow.trim(),
      title: form.hero_title.trim(),
      intro: form.hero_intro.trim(),
      image: form.hero_image.trim(),
    };
    const seo = {
      title: form.seo_title.trim(),
      description: form.seo_description.trim(),
      ogImage: form.seo_og_image.trim(),
      noindex: form.seo_noindex,
    };
    const hasHero = Object.values(hero).some(Boolean);
    const hasSeo = form.seo_noindex || [seo.title, seo.description, seo.ogImage].some(Boolean);

    return {
      key: form.key.trim() || slugify(`${form.kind}-${form.title}`),
      kind: form.kind,
      // A fragment has no URL of its own — it is pulled into a coded page.
      slug: form.kind === "fragment" ? null : form.slug.trim() || slugify(form.title),
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      tag: form.tag.trim() || null,
      reading_minutes: form.reading_minutes ? Number(form.reading_minutes) : null,
      display_order: Number(form.display_order) || 0,
      hero: hasHero ? hero : null,
      seo: hasSeo ? seo : null,
      source: form.source_label || form.source_href ? { label: form.source_label, href: form.source_href } : null,
      related: related.length
        ? related.map((entry) => ({ label: str(entry, "label"), href: str(entry, "href") }))
        : null,
      is_published: form.is_published,
    };
  }

  function submit() {
    if (!form.title.trim()) return;
    if (page) {
      update.mutate(payload(), { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload(), {
        onSuccess: (created) => {
          onOpenChange(false);
          onCreated?.(created);
        },
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{page ? page.title : "New content"}</SheetTitle>
          <SheetDescription>
            The key is what code asks for; the slug is what a visitor types. A fragment has a key and no slug.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <Tabs defaultValue="basics">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kind</Label>
                  <Select value={form.kind} onValueChange={(value) => set("kind", value as ContentKind)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_KINDS.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {CONTENT_KIND_LABELS[kind]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <Input
                    value={form.key}
                    placeholder="guide.visa"
                    onChange={(event) => set("key", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={form.title} onChange={(event) => set("title", event.target.value)} />
              </div>

              {form.kind !== "fragment" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Slug</Label>
                  <Input
                    value={form.slug}
                    placeholder={slugify(form.title) || "student-visa"}
                    onChange={(event) => set("slug", event.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Excerpt</Label>
                <Textarea rows={3} value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tag</Label>
                  <Input value={form.tag} onChange={(event) => set("tag", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Reading minutes</Label>
                  <Input
                    inputMode="numeric"
                    value={form.reading_minutes}
                    onChange={(event) => set("reading_minutes", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Order</Label>
                  <Input
                    inputMode="numeric"
                    value={form.display_order}
                    onChange={(event) => set("display_order", event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-[13px] font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">Unpublished pages are invisible to the public API.</p>
                </div>
                <Switch checked={form.is_published} onCheckedChange={(value) => set("is_published", value)} />
              </div>
            </TabsContent>

            <TabsContent value="hero" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Eyebrow</Label>
                <Input value={form.hero_eyebrow} onChange={(event) => set("hero_eyebrow", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hero title</Label>
                <Input
                  value={form.hero_title}
                  placeholder={form.title}
                  onChange={(event) => set("hero_title", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Intro</Label>
                <Textarea rows={4} value={form.hero_intro} onChange={(event) => set("hero_intro", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Image</Label>
                <Input
                  value={form.hero_image}
                  placeholder="/images/…"
                  onChange={(event) => set("hero_image", event.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Meta title</Label>
                <Input
                  value={form.seo_title}
                  placeholder={form.title}
                  onChange={(event) => set("seo_title", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Meta description</Label>
                <Textarea
                  rows={3}
                  value={form.seo_description}
                  onChange={(event) => set("seo_description", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Share image</Label>
                <Input value={form.seo_og_image} onChange={(event) => set("seo_og_image", event.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-[13px] font-medium">Hide from search engines</p>
                  <p className="text-xs text-muted-foreground">Sets noindex. The page stays reachable by URL.</p>
                </div>
                <Switch checked={form.seo_noindex} onCheckedChange={(value) => set("seo_noindex", value)} />
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4 pt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Authority this page defers to
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={form.source_label}
                    placeholder="UK Home Office"
                    onChange={(event) => set("source_label", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Link</Label>
                  <Input value={form.source_href} onChange={(event) => set("source_href", event.target.value)} />
                </div>
              </div>

              <Repeater
                label="Related"
                hint="Shown at the foot of the page as where to read next."
                items={related}
                onChange={setRelated}
                empty={{ label: "", href: "" }}
                addLabel="Add link"
                renderRow={(item, setField) => (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input value={str(item, "label")} onChange={(event) => setField("label", event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Link</Label>
                      <Input value={str(item, "href")} onChange={(event) => setField("href", event.target.value)} />
                    </div>
                  </>
                )}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending || !form.title.trim()}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {page ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
