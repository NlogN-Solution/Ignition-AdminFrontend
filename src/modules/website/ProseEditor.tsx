import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List as ListIcon, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Rich text for `prose` blocks.
 *
 * **This does not store HTML.** It reads and writes a plain array of
 * paragraphs, which is the shape `BlogSection` on the public site already
 * consumes. TipTap is the editing surface; the stored value stays a
 * constrained document.
 *
 * The reason is narrow and worth keeping: the codebase contains zero uses of
 * `dangerouslySetInnerHTML`, and storing editor HTML would make the first one
 * mandatory — on content typed by whoever holds a marketing login. Formatting
 * that survives is what the block schema names; anything else is dropped on
 * save rather than smuggled through as markup.
 */
export function ProseEditor({
  paragraphs,
  onChange,
  placeholder,
}: {
  paragraphs: string[];
  onChange: (paragraphs: string[]) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // No headings inside a block: the block's own `heading` field is the
        // heading, and a second level here would fight the page's outline.
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
      }),
    ],
    content: paragraphs.filter(Boolean).map((text) => `<p>${escapeHtml(text)}</p>`).join("") || "<p></p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-24 px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(toParagraphs(instance.getJSON()));
    },
  });

  // Re-seed when the caller swaps to a different block.
  useEffect(() => {
    if (!editor) return;
    const current = toParagraphs(editor.getJSON());
    if (JSON.stringify(current) === JSON.stringify(paragraphs)) return;
    editor.commands.setContent(
      paragraphs.filter(Boolean).map((text) => `<p>${escapeHtml(text)}</p>`).join("") || "<p></p>",
      { emitUpdate: false },
    );
    // Seeding is driven by the incoming value alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, JSON.stringify(paragraphs)]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Stored as paragraphs, not markup
        </span>
      </div>
      <EditorContent editor={editor} />
      {paragraphs.length === 0 && placeholder && (
        <p className="px-3 pb-2 text-xs text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", active && "bg-accent text-accent-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
}

/** Flatten the document to one string per top-level paragraph or list item. */
function toParagraphs(doc: unknown): string[] {
  const node = doc as TipTapNode;
  const out: string[] = [];

  const text = (n: TipTapNode): string =>
    n.text ?? (n.content ?? []).map(text).join("");

  for (const child of node.content ?? []) {
    if (child.type === "paragraph") {
      const value = text(child).trim();
      if (value) out.push(value);
    } else if (child.type === "bulletList" || child.type === "orderedList") {
      for (const item of child.content ?? []) {
        const value = text(item).trim();
        if (value) out.push(child.type === "orderedList" ? value : `• ${value}`);
      }
    }
  }
  return out;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
