import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, FileStack } from "lucide-react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { WorkflowStageRead } from "./types";

interface SortableStageRowProps {
  stage: WorkflowStageRead;
  index: number;
  onClick: () => void;
  onToggleActive: (isActive: boolean) => void;
}

export function SortableStageRow({ stage, index, onClick, onToggleActive }: SortableStageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow",
        isDragging && "z-10 shadow-lg",
        !stage.is_active && "opacity-60",
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

      <span className="w-6 shrink-0 text-center text-xs font-medium tabular-nums text-muted-foreground/60">{index + 1}</span>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${stage.color ?? "#6B7280"}1A`, color: stage.color ?? "#6B7280" }}
      >
        <DynamicIcon name={stage.icon} className="h-4.5 w-4.5" />
      </span>

      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-medium text-foreground">{stage.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {stage.category && <span className="capitalize">{stage.category}</span>}
          {stage.document_requirements.length > 0 && (
            <span className="flex items-center gap-1">
              <FileStack className="h-3 w-3" />
              {stage.document_requirements.length} document{stage.document_requirements.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </button>

      <Switch checked={stage.is_active} onCheckedChange={onToggleActive} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
