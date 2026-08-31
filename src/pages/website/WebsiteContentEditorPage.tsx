import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ExternalLink, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";
import { BlockEditor } from "@/modules/website/BlockEditor";
import { ContentPageSheet } from "@/modules/website/ContentPageSheet";
import { contentService } from "@/modules/website/contentService";
import { useContentPage, usePublishContentPage } from "@/modules/website/contentHooks";
import { CONTENT_KIND_LABELS } from "@/modules/website/contentTypes";
import { getErrorMessage } from "@/utils/errors";

/**
 * One page and its blocks.
 *
 * A full route rather than a sheet: this is where an editor spends an hour,
 * and it needs the width for the rail and the form side by side.
 */
export function WebsiteContentEditorPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { data: page, isLoading } = useContentPage(pageId);
  const publish = usePublishContentPage(pageId ?? "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  async function openPreview() {
    if (!pageId) return;
    setPreviewing(true);
    try {
      const { url } = await contentService.pages.preview(pageId);
      if (!url) {
        toast.error("No preview available — the public site has no shared secret configured.");
        return;
      }
      window.open(url, "_blank", "noopener");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPreviewing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <EmptyState
        icon={FileText}
        title="Not found"
        description="This page has been deleted, or the link is wrong."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-1">
        <div className="min-w-0 space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 h-7 text-muted-foreground" asChild>
            <Link to={page.kind === "post" ? "/website/blog" : page.kind === "guide" ? "/website/guides" : "/website/pages"}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">{page.title}</h1>
            <Badge variant="secondary">{CONTENT_KIND_LABELS[page.kind]}</Badge>
            <Badge variant={page.is_published ? "default" : "secondary"}>
              {page.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {page.key}
            {page.slug ? ` · /${page.slug}` : " · no URL of its own"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openPreview} disabled={previewing}>
            {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </Button>
          <Button
            size="sm"
            variant={page.is_published ? "outline" : "default"}
            disabled={publish.isPending}
            onClick={() => {
              if (page.is_published && !window.confirm("Take this off the public site?")) return;
              publish.mutate(!page.is_published);
            }}
          >
            {publish.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {page.is_published ? "Retract" : "Publish"}
          </Button>
        </div>
      </div>

      <BlockEditor pageId={page.id} blocks={page.blocks} />

      <ContentPageSheet page={page} open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
