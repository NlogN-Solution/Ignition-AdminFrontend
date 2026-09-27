import { Newspaper } from "lucide-react";
import { ContentList } from "@/modules/website/ContentList";

/**
 * The blog: articles written in the full-screen editor and shown under
 * /resources/blog. Only published articles appear on the site.
 *
 * The older "link posts" (the `blog_posts` table behind `/public/posts`) are
 * no longer listed here — the public site does not read them. Their API is
 * unchanged.
 */
export function WebsiteBlogPage() {
  return (
    <ContentList
      title="Blog"
      description="Articles shown under /resources/blog on the public site. Only published articles appear there."
      kinds={["post"]}
      icon={Newspaper}
      newLabel="New article"
      editorBase="/website/blog"
    />
  );
}
