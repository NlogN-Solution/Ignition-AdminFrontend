import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BLOCK_META, blockSummary } from "./blocks";
import type { ContentBlockRead } from "./contentTypes";

export function SortableBlockRow({
  block,
  index,
  selected,
  onSelect,
  onToggleVisible,
  onDelete,
}: {
  block: ContentBlockRead;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: (visible: boolean) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = BLOCK_META[block.block_type];
  const Icon = meta?.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm transition-shadow",
        selected ? "border-primary/60 ring-1 ring-primary/30" : "border-border",
        isDragging && "z-10 shadow-lg",
        !block.is_visible && "opacity-55",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="w-5 shrink-0 text-center text-xs font-medium tabular-nums text-muted-foreground/60">
        {index + 1}
      </span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
      </span>

      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-medium text-foreground">{meta?.label ?? block.block_type}</p>
        <p className="truncate text-xs text-muted-foreground">{blockSummary(block.block_type, block.data)}</p>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground"
        title={block.is_visible ? "Hide from the page" : "Show on the page"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleVisible(!block.is_visible);
        }}
      >
        {block.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
