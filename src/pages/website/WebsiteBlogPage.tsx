import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Newspaper, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/useDebounce";
import { ContentList } from "@/modules/website/ContentList";
import { useBlogPosts, useCreateBlogPost, useDeleteBlogPost, useUpdateBlogPost } from "@/modules/website/contentHooks";
import type { BlogPostRead } from "@/modules/website/contentTypes";

/**
 * Two things sit under Blog, and they are genuinely different.
 *
 * **Articles** are `content_pages` of kind `post` — written here, block by
 * block, and rendered by the site's own components.
 *
 * **Link posts** are rows in the older `blog_posts` table, which is what
 * `/public/posts` still serves. They are a flat title-and-body, often only a
 * link out to something published elsewhere. They are not a legacy mistake to
 * be migrated away — a one-line post pointing at a Home Office announcement
 * has no business being a block document — but they are also not editable as
 * one, which is why they are a separate tab rather than a separate kind.
 */
export function WebsiteBlogPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Blog"
        description="Articles are built from blocks. Link posts are the short, flat entries the public feed has always served."
      />

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="links">Link posts</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="pt-4">
          <ContentList
            hideHeader
            title="Articles"
            description="Long-form posts built from blocks."
            kinds={["post"]}
            icon={Newspaper}
            newLabel="New article"
          />
        </TabsContent>

        <TabsContent value="links" className="pt-4">
          <LinkPosts />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LinkPosts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BlogPostRead | null>(null);
  const [creating, setCreating] = useState(false);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useBlogPosts({ page, limit: 25, search: debounced || undefined });
  const remove = useDeleteBlogPost();

  const columns = useMemo<ColumnDef<BlogPostRead, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Post",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">/{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <span className="text-xs">{row.original.category ?? "—"}</span>,
      },
      {
        accessorKey: "author",
        header: "Author",
        cell: ({ row }) => <span className="text-xs">{row.original.author ?? "—"}</span>,
      },
      {
        id: "state",
        header: "State",
        cell: ({ row }) => (
          <Badge variant={row.original.is_published ? "default" : "secondary"}>
            {row.original.is_published ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              if (!window.confirm(`Delete “${row.original.title}”?`)) return;
              remove.mutate(row.original.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [remove],
  );

  return (
    <div className="space-y-4">
      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search posts…"
        filters={
          <Button size="sm" className="h-8" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> New link post
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={setEditing}
        page={page}
        limit={25}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={Newspaper}
            title="No link posts"
            description="Until now the only thing that could write one of these was an import script."
          />
        }
      />

      <LinkPostDialog
        post={editing}
        open={Boolean(editing) || creating}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
      />
    </div>
  );
}

const EMPTY = {
  slug: "",
  title: "",
  category: "",
  author: "",
  description: "",
  body: "",
  image_url: "",
  external_url: "",
  is_published: false,
};

function LinkPostDialog({
  post,
  open,
  onOpenChange,
}: {
  post: BlogPostRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateBlogPost();
  const update = useUpdateBlogPost();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      post
        ? {
            slug: post.slug,
            title: post.title,
            category: post.category ?? "",
            author: post.author ?? "",
            description: post.description ?? "",
            body: post.body ?? "",
            image_url: post.image_url ?? "",
            external_url: post.external_url ?? "",
            is_published: post.is_published,
          }
        : EMPTY,
    );
  }, [open, post]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isPending = create.isPending || update.isPending;

  function submit() {
    if (!form.title.trim()) return;
    const payload = {
      slug:
        form.slug.trim() ||
        form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      title: form.title.trim(),
      category: form.category.trim() || null,
      author: form.author.trim() || null,
      description: form.description.trim() || null,
      body: form.body.trim() || null,
      image_url: form.image_url.trim() || null,
      external_url: form.external_url.trim() || null,
      is_published: form.is_published,
    };
    if (post) {
      update.mutate({ id: post.id, payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{post ? post.title : "New link post"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(event) => set("title", event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Slug</Label>
              <Input value={form.slug} onChange={(event) => set("slug", event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Input value={form.category} onChange={(event) => set("category", event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Author</Label>
            <Input value={form.author} onChange={(event) => set("author", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Summary</Label>
            <Textarea rows={2} value={form.description} onChange={(event) => set("description", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Body</Label>
            <Textarea rows={6} value={form.body} onChange={(event) => set("body", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
            <Input value={form.image_url} onChange={(event) => set("image_url", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Links out to</Label>
            <Input
              value={form.external_url}
              placeholder="https://…"
              onChange={(event) => set("external_url", event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-[13px] font-medium">Published</p>
              <p className="text-xs text-muted-foreground">Appears in the public feed immediately.</p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={(value) => set("is_published", value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !form.title.trim()}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {post ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
