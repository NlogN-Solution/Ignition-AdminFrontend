import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Layers, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BLOCK_META, BLOCK_TYPES, emptyBlockData, type BlockType } from "./blocks";
import { BlockForm } from "./BlockForm";
import { SortableBlockRow } from "./SortableBlockRow";
import type { ContentBlockRead } from "./contentTypes";
import { useCreateBlock, useDeleteBlock, useReorderBlocks, useUpdateBlock } from "./contentHooks";

/**
 * The page as an ordered list of blocks: rail on the left, the selected
 * block's form on the right.
 *
 * Edits are held locally and committed with Save rather than on every
 * keystroke. Autosave was the obvious alternative and is the wrong one here —
 * every block write invalidates the page query, so a save per keystroke would
 * refetch and re-render the form under the cursor.
 */
export function BlockEditor({ pageId, blocks }: { pageId: string; blocks: ContentBlockRead[] }) {
  const [order, setOrder] = useState<ContentBlockRead[]>(blocks);
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  const create = useCreateBlock(pageId);
  const update = useUpdateBlock(pageId);
  const remove = useDeleteBlock(pageId);
  const reorder = useReorderBlocks(pageId);

  // The server list is the truth; local order only leads it during a drag.
  useEffect(() => {
    setOrder(blocks);
    setSelectedId((current) => (current && blocks.some((b) => b.id === current) ? current : blocks[0]?.id ?? null));
  }, [blocks]);

  const selected = useMemo(() => order.find((block) => block.id === selectedId) ?? null, [order, selectedId]);

  // Re-seed the draft when the selection changes, not when the block's own
  // data changes — otherwise a refetch mid-edit would wipe what was typed.
  useEffect(() => {
    setDraft(selected ? { ...selected.data } : null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = Boolean(selected && draft && JSON.stringify(draft) !== JSON.stringify(selected.data));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.findIndex((block) => block.id === active.id);
    const to = order.findIndex((block) => block.id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next);
    reorder.mutate(next.map((block) => block.id));
  }

  function select(id: string) {
    if (dirty && !window.confirm("Discard unsaved changes to this block?")) return;
    setSelectedId(id);
  }

  function addBlock(type: BlockType) {
    create.mutate(
      {
        page_id: pageId,
        block_type: type,
        data: emptyBlockData(type),
        display_order: order.length,
      },
      { onSuccess: (block) => setSelectedId(block.id) },
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {order.map((block, index) => (
                <SortableBlockRow
                  key={block.id}
                  block={block}
                  index={index}
                  selected={block.id === selectedId}
                  onSelect={() => select(block.id)}
                  onToggleVisible={(visible) => {
                    setOrder((prev) =>
                      prev.map((entry) => (entry.id === block.id ? { ...entry, is_visible: visible } : entry)),
                    );
                    update.mutate({ id: block.id, payload: { is_visible: visible } });
                  }}
                  onDelete={() => {
                    if (!window.confirm("Delete this block? The page loses this section.")) return;
                    remove.mutate(block.id);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {order.length === 0 && (
          <EmptyState
            icon={Layers}
            title="No blocks yet"
            description="A page is an ordered list of blocks. Add the first one."
          />
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full border-dashed" disabled={create.isPending}>
              <Plus className="h-3.5 w-3.5" /> Add block
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-1.5">
            <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
              {BLOCK_TYPES.map((type) => {
                const meta = BLOCK_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-accent"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-foreground">{meta.label}</span>
                      <span className="block text-xs leading-snug text-muted-foreground">{meta.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        {selected && draft ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{BLOCK_META[selected.block_type].label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Renders with {BLOCK_META[selected.block_type].rendersWith}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {dirty && <Badge variant="secondary">Unsaved</Badge>}
                <Button
                  size="sm"
                  disabled={!dirty || update.isPending}
                  onClick={() => update.mutate({ id: selected.id, payload: { data: draft } })}
                >
                  <Save className="h-3.5 w-3.5" /> Save block
                </Button>
              </div>
            </div>
            <BlockForm type={selected.block_type} data={draft} onChange={setDraft} />
          </>
        ) : (
          <EmptyState
            icon={Layers}
            title="Nothing selected"
            description="Pick a block on the left, or add one."
          />
        )}
      </div>
    </div>
  );
}
