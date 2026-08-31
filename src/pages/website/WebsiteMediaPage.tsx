import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDeleteMedia, useMediaAssets, useUpdateMedia, useUploadMedia } from "@/modules/website/hooks";
import type { MediaAssetRead } from "@/modules/website/types";

/**
 * Public-site media.
 *
 * These are the only uploads in the product that get a real public URL —
 * avatars and student documents are private and reachable only through a
 * short-lived signed link. A university logo has to be fetchable by any
 * visitor, so it goes to a separate Cloudinary folder with public delivery.
 */
export function WebsiteMediaPage() {
  const [page, setPage] = useState(1);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useMediaAssets({ page, limit: 40 });
  const upload = useUploadMedia();
  const remove = useDeleteMedia();

  function send(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) upload.mutate(file);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Media"
        description="Images used by the public site. Every file here is publicly readable — do not upload anything a visitor should not see."
        actions={
          <Button size="sm" onClick={() => input.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </Button>
        }
      />

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          send(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          send(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border border-dashed p-6 text-center text-sm transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border text-muted-foreground",
        )}
      >
        Drop images here, or use Upload.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState icon={ImageIcon} title="Nothing uploaded yet" description="Logos, hero images and gallery shots live here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.items.map((asset) => <AssetCard key={asset.id} asset={asset} onDelete={() => remove.mutate(asset.id)} />)}
        </div>
      )}

      {data && data.total > 40 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{data.total} files</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page * 40 >= data.total} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, onDelete }: { asset: MediaAssetRead; onDelete: () => void }) {
  const update = useUpdateMedia();
  const [alt, setAlt] = useState(asset.alt_text ?? "");

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="aspect-video overflow-hidden rounded-lg bg-muted">
        <img src={asset.url} alt={asset.alt_text ?? ""} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Alt text</Label>
        <Input
          className="h-8 text-xs"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          onBlur={() => {
            if (alt !== (asset.alt_text ?? "")) update.mutate({ id: asset.id, payload: { alt_text: alt || null } });
          }}
          placeholder="Describe the image"
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="truncate text-xs text-muted-foreground hover:text-foreground"
          onClick={() => void navigator.clipboard.writeText(asset.url)}
          title="Copy URL"
        >
          Copy URL
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            if (!window.confirm("Delete this file? Any page still using it will show a broken image.")) return;
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
