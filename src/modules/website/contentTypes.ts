import type { BlockType } from "./blocks";

export const CONTENT_KINDS = ["page", "guide", "post", "fragment"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_KIND_LABELS: Record<ContentKind, string> = {
  page: "Page",
  guide: "Guide",
  post: "Article",
  // A fragment has a key and no URL: it is a named piece of copy that a coded
  // page pulls in — the homepage hero, a policy notice.
  fragment: "Fragment",
};

export interface ContentBlockRead {
  id: string;
  page_id: string;
  block_type: BlockType;
  data: Record<string, unknown>;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentBlockPayload {
  page_id: string;
  block_type: BlockType;
  data: Record<string, unknown>;
  display_order?: number;
  is_visible?: boolean;
}

export interface ContentPageRead {
  id: string;
  key: string;
  kind: ContentKind;
  slug: string | null;
  title: string;
  excerpt: string | null;
  tag: string | null;
  hero: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
  source: { label?: string; href?: string } | null;
  related: { label?: string; href?: string }[] | null;
  reading_minutes: number | null;
  published_at: string | null;
  is_published: boolean;
  author_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentPageDetail extends ContentPageRead {
  blocks: ContentBlockRead[];
}

export type ContentPagePayload = Partial<Omit<ContentPageRead, "id" | "created_at" | "updated_at">> & {
  key: string;
  kind: ContentKind;
  title: string;
};

export interface ContentPagePublishResult {
  page: ContentPageRead;
  /** False when the landing was never called, or could not be reached. */
  revalidated: boolean;
}

export interface ContentPagePreview {
  /** Null when no shared secret is configured — there is nowhere to preview. */
  url: string | null;
}

export interface BlogPostRead {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  author: string | null;
  description: string | null;
  body: string | null;
  image_url: string | null;
  external_url: string | null;
  published_at: string | null;
  is_published: boolean;
}

export type BlogPostPayload = Partial<Omit<BlogPostRead, "id">> & { slug: string; title: string };
