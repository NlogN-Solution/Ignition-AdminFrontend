import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Pin, PinOff, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDashboardLayoutStore } from "@/hooks/useDashboardLayoutStore";

export interface DashboardWidget {
  id: string;
  title: string;
  render: ReactNode;
  span?: "third" | "half" | "full";
  defaultHidden?: boolean;
  /**
   * Sits at the top of the dashboard and stays there.
   *
   * Stronger than pinning, which is the reader's own choice and can be undone
   * by dragging something above it. This is for the one widget whose whole
   * value is being seen before anything else — a student who registered an hour
   * ago and has not been contacted. A saved layout, a pin on another widget and
   * a drag all lose to it.
   */
  alwaysFirst?: boolean;
}

const SPAN_CLASSES: Record<NonNullable<DashboardWidget["span"]>, string> = {
  third: "md:col-span-1",
  half: "md:col-span-2",
  full: "md:col-span-3",
};

function SortableWidget({
  widget,
  editing,
  hidden,
  pinned,
  onToggleHidden,
  onTogglePinned,
}: {
  widget: DashboardWidget;
  editing: boolean;
  hidden: boolean;
  pinned: boolean;
  onToggleHidden: () => void;
  onTogglePinned: () => void;
}) {
  const locked = Boolean(widget.alwaysFirst);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing || locked,
  });

  if (hidden && !editing) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(SPAN_CLASSES[widget.span ?? "third"], "relative", isDragging && "z-10", hidden && editing && "opacity-40")}
    >
      {editing && (
        <div className="mb-1.5 flex items-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 px-2 py-1">
          {locked ? (
            <Pin className="h-3.5 w-3.5 text-muted-foreground/60" />
          ) : (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
            {widget.title}
            {locked && <span className="ml-1.5 text-muted-foreground/60">· always first</span>}
          </span>
          {!locked && (
            <button type="button" onClick={onTogglePinned} className="text-muted-foreground/60 hover:text-foreground">
              {pinned ? <Pin className="h-3.5 w-3.5 fill-current" /> : <PinOff className="h-3.5 w-3.5" />}
            </button>
          )}
          <button type="button" onClick={onToggleHidden} className="text-muted-foreground/60 hover:text-foreground">
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      {!hidden && widget.render}
    </div>
  );
}

export function CustomizableDashboard({ widgets, storageKey }: { widgets: DashboardWidget[]; storageKey: string }) {
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const defaultOrder = useMemo(() => widgets.map((w) => w.id), [widgets]);
  const layout = useDashboardLayoutStore((s) => s.layouts[storageKey]);
  const setOrder = useDashboardLayoutStore((s) => s.setOrder);
  const toggleHidden = useDashboardLayoutStore((s) => s.toggleHidden);
  const togglePinned = useDashboardLayoutStore((s) => s.togglePinned);
  const reset = useDashboardLayoutStore((s) => s.reset);

  const widgetMap = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);

  /**
   * The saved order, with widgets the user has never seen slotted in.
   *
   * Ids the saved layout no longer knows about are dropped, and new ones are
   * inserted at their DEFAULT index rather than appended. Appending was the old
   * behaviour and it quietly buried every new widget: anyone who had ever
   * reordered their dashboard — which is everyone, since saving happens on first
   * drag — got it last, under the task board, however deliberately it had been
   * placed at the top for new users.
   */
  const order = useMemo(() => {
    const stored = layout?.order ?? [];
    const known = stored.filter((id) => widgetMap.has(id));
    if (known.length === 0) return defaultOrder;

    const next = [...known];
    defaultOrder.forEach((id, defaultIndex) => {
      if (next.includes(id)) return;
      // Clamped: a widget placed 8th in a default list of 13 should not land
      // past the end of a saved list the user has trimmed to 6.
      next.splice(Math.min(defaultIndex, next.length), 0, id);
    });
    return next;
  }, [layout, defaultOrder, widgetMap]);

  const hidden = useMemo(() => {
    const explicitlyHidden = new Set(layout?.hidden ?? []);
    const defaultsHidden = widgets.filter((w) => w.defaultHidden && !layout).map((w) => w.id);
    return new Set([...explicitlyHidden, ...defaultsHidden]);
  }, [layout, widgets]);

  const pinned = new Set(layout?.pinned ?? []);

  const orderedIds = useMemo(() => {
    // Three tiers: always-first, then the reader's pins, then everything else.
    const alwaysFirst = order.filter((id) => widgetMap.get(id)?.alwaysFirst);
    const rest = order.filter((id) => !widgetMap.get(id)?.alwaysFirst);
    const pinnedIds = rest.filter((id) => pinned.has(id));
    const restIds = rest.filter((id) => !pinned.has(id));
    return [...alwaysFirst, ...pinnedIds, ...restIds];
  }, [order, pinned, widgetMap]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    setOrder(storageKey, arrayMove(order, oldIndex, newIndex));
  }

  const activeWidget = activeId ? widgetMap.get(activeId) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        {editing && (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => reset(storageKey)}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset layout
          </Button>
        )}
        <Button variant={editing ? "secondary" : "outline"} size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setEditing((e) => !e)}>
          <Settings2 className="h-3.5 w-3.5" /> {editing ? "Done" : "Customize"}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {orderedIds.map((id) => {
              const widget = widgetMap.get(id);
              if (!widget) return null;
              return (
                <SortableWidget
                  key={id}
                  widget={widget}
                  editing={editing}
                  hidden={hidden.has(id)}
                  pinned={pinned.has(id)}
                  onToggleHidden={() => toggleHidden(storageKey, id, defaultOrder)}
                  onTogglePinned={() => togglePinned(storageKey, id, defaultOrder)}
                />
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>{activeWidget ? <div className="rounded-xl border border-primary bg-card p-3 opacity-90 shadow-lg">{activeWidget.title}</div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
