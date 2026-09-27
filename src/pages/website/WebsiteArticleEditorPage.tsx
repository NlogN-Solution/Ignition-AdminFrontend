import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Eye, FileText, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { RichTextEditor } from "@/modules/website/RichTextEditor";
import { contentService } from "@/modules/website/contentService";
import { websiteService } from "@/modules/website/service";
import {
  useContentPage,
  useContentPages,
  useCreateContentPage,
  useDeleteContentPage,
  usePublishContentPage,
  useUpdateContentPage,
} from "@/modules/website/contentHooks";
import type { ContentPageDetail } from "@/modules/website/contentTypes";
import { formatDateTime } from "@/utils/format";
import { getErrorMessage } from "@/utils/errors";

type ArticleKind = "post" | "guide";

const COPY: Record<ArticleKind, { noun: string; list: string; base: string; tagLabel: string; tags: string[] }> = {
  post: {
    noun: "article",
    list: "Blog",
    base: "/website/blog",
    tagLabel: "Category",
    tags: ["Money", "Choosing", "Applying", "Visa", "Arriving"],
  },
  guide: {
    noun: "guide",
    list: "Guides",
    base: "/website/guides",
    tagLabel: "Group",
    tags: ["Before you choose", "Applying", "Paying for it", "Visa", "Life in the UK"],
  },
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

interface Draft {
  title: string;
  slug: string;
  excerpt: string;
  tag: string;
  cover_image_url: string;
  body_html: string;
}

const EMPTY: Draft = { title: "", slug: "", excerpt: "", tag: "", cover_image_url: "", body_html: "" };

const fromPage = (page: ContentPageDetail): Draft => ({
  title: page.title,
  slug: page.slug ?? "",
  excerpt: page.excerpt ?? "",
  tag: page.tag ?? "",
  cover_image_url: page.cover_image_url ?? "",
  body_html: page.body_html ?? "",
});

/**
 * Writing an article or a guide.
 *
 * Full screen, because writing is the whole job here: the page covers the
 * console chrome and gives the body the width of the window. It asks only for
 * what the public site shows — title, slug, excerpt, a category, a cover image
 * and the body, written in CKEditor with images uploaded to the media library.
 * The hero, SEO and link tabs of the older block editor are gone from this
 * flow; the site derives all of those from these fields.
 */
export function WebsiteArticleEditorPage({ kind }: { kind: ArticleKind }) {
  const { pageId } = useParams();
  const isNew = !pageId || pageId === "new";
  const copy = COPY[kind];
  const navigate = useNavigate();

  const { data: page, isLoading } = useContentPage(isNew ? undefined : pageId);
  const create = useCreateContentPage();
  const update = useUpdateContentPage(isNew ? "" : (pageId as string));
  const publish = usePublishContentPage(isNew ? "" : (pageId as string));
  const remove = useDeleteContentPage();
  // Existing categories, offered alongside the defaults.
  const { data: siblings } = useContentPages({ kind, limit: 200 });

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<Draft>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!page) return;
    const next = fromPage(page);
    setDraft(next);
    setSaved(next);
    setSlugTouched(true);
  }, [page]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // Leaving with unsaved writing should not be one click away.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const tagOptions = useMemo(() => {
    const existing = (siblings?.items ?? []).map((item) => item.tag).filter((tag): tag is string => Boolean(tag));
    return [...new Set([...copy.tags, ...existing])];
  }, [siblings, copy.tags]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      // The slug follows the title until someone edits it by hand.
      if (key === "title" && !slugTouched) next.slug = slugify(value as string);
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = "Give it a title.";
    if (!draft.slug) next.slug = "Needed for the page URL.";
    else if (!SLUG.test(draft.slug)) next.slug = "Lowercase letters, numbers and single hyphens only.";
    if (!draft.excerpt.trim()) next.excerpt = "One or two sentences for the listing and search results.";
    if (!draft.body_html.replace(/<[^>]+>/g, "").trim() && !/<img/i.test(draft.body_html)) {
      next.body_html = "The body is empty.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    title: draft.title.trim(),
    slug: draft.slug,
    excerpt: draft.excerpt.trim() || null,
    tag: draft.tag.trim() || null,
    cover_image_url: draft.cover_image_url || null,
    body_html: draft.body_html,
  });

  /** Returns the saved page id, or null if saving failed. */
  const save = async (): Promise<string | null> => {
    if (!validate()) {
      toast.error("Some fields need attention.");
      return null;
    }
    try {
      if (isNew) {
        const created = await create.mutateAsync({ key: `${kind}.${draft.slug}`, kind, ...payload() });
        setSaved(draft);
        navigate(`${copy.base}/${created.id}`, { replace: true });
        return created.id;
      }
      await update.mutateAsync(payload());
      setSaved(draft);
      return pageId as string;
    } catch {
      // The mutation hooks have already shown the server's message.
      return null;
    }
  };

  const togglePublish = async () => {
    if (isNew || !page) return;
    if (!page.is_published) {
      if (dirty && !(await save())) return;
      if (!validate()) return;
    }
    publish.mutate(!page.is_published);
  };

  const openPreview = async () => {
    if (isNew || !pageId) return;
    try {
      const { url } = await contentService.pages.preview(pageId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.info("Preview isn't configured for this environment. Publish to see it on the site.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const asset = await websiteService.media.upload(file);
      set("cover_image_url", asset.url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingCover(false);
    }
  };

  const busy = create.isPending || update.isPending;

  if (!isNew && isLoading) {
    return (
      <Shell>
        <div className="mx-auto max-w-5xl space-y-4 p-8">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-[60vh] w-full" />
        </div>
      </Shell>
    );
  }

  if (!isNew && !page) {
    return (
      <Shell>
        <div className="p-8">
          <EmptyState icon={FileText} title={`This ${copy.noun} was not found`} description="It may have been deleted." />
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate(copy.base)}>
              Back to {copy.list}
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
            navigate(copy.base);
          }}
        >
          <ArrowLeft className="h-4 w-4" /> {copy.list}
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {draft.title || `New ${copy.noun}`}
          </span>
          {!isNew && (
            <Badge variant={page?.is_published ? "default" : "secondary"}>
              {page?.is_published ? "Published" : "Draft"}
            </Badge>
          )}
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={openPreview}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={busy || (!dirty && !isNew)} onClick={save}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? "Save draft" : "Save"}
          </Button>
          {!isNew && (
            <Button size="sm" disabled={publish.isPending || busy} onClick={togglePublish}>
              {publish.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {page?.is_published ? "Unpublish" : "Publish"}
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Writing column */}
        <div className="min-w-0 space-y-5">
          <div>
            <input
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={`${copy.noun[0].toUpperCase()}${copy.noun.slice(1)} title`}
              aria-label="Title"
              className="w-full bg-transparent text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              value={draft.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="One or two sentences shown on the listing and under the title."
            />
            {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Body</Label>
            {/* Keyed on the page so switching records remounts the editor
                with that record's text. */}
            <RichTextEditor
              key={isNew ? "new" : pageId}
              value={draft.body_html}
              onChange={(html) => set("body_html", html)}
            />
            {errors.body_html && <p className="text-sm text-destructive">{errors.body_html}</p>}
          </div>
        </div>

        {/* Settings column */}
        <aside className="space-y-5 lg:sticky lg:top-16 lg:self-start">
          <section className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                placeholder="what-a-uk-year-costs"
                className="font-mono text-[13px]"
              />
              <p className="text-[11px] text-muted-foreground">
                {kind === "post" ? "/resources/blog/" : "/resources/guides/"}
                {draft.slug || "…"}
              </p>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tag">{copy.tagLabel}</Label>
              <Input
                id="tag"
                list="article-tags"
                value={draft.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="Optional"
              />
              <datalist id="article-tags">
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Label>Cover image</Label>
            {draft.cover_image_url ? (
              <div className="relative">
                <img src={draft.cover_image_url} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7"
                  aria-label="Remove cover image"
                  onClick={() => set("cover_image_url", "")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInput.current?.click()}
                disabled={uploadingCover}
                className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {uploadingCover ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                {uploadingCover ? "Uploading…" : "Upload an image"}
              </button>
            )}
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadCover(file);
              }}
            />
            <Input
              value={draft.cover_image_url}
              onChange={(e) => set("cover_image_url", e.target.value.trim())}
              placeholder="…or paste an image URL"
              className="text-[13px]"
            />
          </section>

          {!isNew && page && (
            <section className="space-y-2 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <p>
                {page.is_published && page.published_at
                  ? `Published ${formatDateTime(page.published_at)}`
                  : "Not published yet — only staff can see it."}
              </p>
              <p>Last saved {formatDateTime(page.updated_at)}</p>
              {page.reading_minutes ? <p>{page.reading_minutes} min read</p> : null}
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 mt-1 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete {copy.noun}
              </Button>
            </section>
          )}
        </aside>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this {copy.noun}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{draft.title}&rdquo; is removed from the site and from the console. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                pageId &&
                remove.mutate(pageId, {
                  onSuccess: () => {
                    setSaved(draft);
                    navigate(copy.base, { replace: true });
                  },
                })
              }
            >
              {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

/** Covers the console chrome: the editor gets the whole window. */
function Shell({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background">{children}</div>;
}
