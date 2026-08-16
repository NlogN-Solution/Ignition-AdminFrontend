import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import { ArrowLeft, Copy, Eye, Plus, Workflow as WorkflowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CountryPicker } from "@/modules/academic/pickers";
import { SortableStageRow } from "@/modules/workflow-templates/SortableStageRow";
import { StageEditorSheet } from "@/modules/workflow-templates/StageEditorSheet";
import {
  useCreateStage,
  useDuplicateWorkflowTemplate,
  useReorderStages,
  useUpdateStage,
  useUpdateWorkflowTemplate,
  useWorkflowTemplate,
} from "@/modules/workflow-templates/hooks";
import { STAGE_COLOR_PRESETS, STAGE_ICON_PRESETS, type WorkflowStageRead } from "@/modules/workflow-templates/types";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { slugify } from "@/utils/format";

export function WorkflowTemplateBuilderPage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const setLabel = useBreadcrumbStore((s) => s.setLabel);

  const { data: template, isLoading } = useWorkflowTemplate(templateId);
  const updateTemplate = useUpdateWorkflowTemplate(templateId ?? "");
  const createStage = useCreateStage(templateId ?? "");
  const reorderStages = useReorderStages(templateId ?? "");
  const updateStage = useUpdateStage(templateId ?? "");
  const duplicateTemplate = useDuplicateWorkflowTemplate();

  const [stages, setStages] = useState<WorkflowStageRead[]>([]);
  const [selectedStage, setSelectedStage] = useState<WorkflowStageRead | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (template) {
      setStages(template.stages);
      setName(template.name);
      setDescription(template.description ?? "");
      setLabel(template.name);
    }
  }, [template, setLabel]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(stages, oldIndex, newIndex);
    setStages(reordered);
    reorderStages.mutate(reordered.map((s) => s.id));
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!template) {
    return <EmptyState icon={WorkflowIcon} title="Template not found" description="It may have been deleted." />;
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/workflow")}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to templates
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-lg flex-1 space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name !== template.name && updateTemplate.mutate({ name })}
            className="h-9 border-none px-0 text-[19px] font-semibold shadow-none focus-visible:ring-0"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (template.description ?? "") && updateTemplate.mutate({ description })}
            placeholder="What is this journey for?"
            rows={1}
            className="resize-none border-none px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
            <Label className="text-xs text-muted-foreground">Active</Label>
            <Switch checked={template.is_active} onCheckedChange={(checked) => updateTemplate.mutate({ is_active: checked })} />
          </div>
          <div className="w-48">
            <CountryPicker
              value={template.country_id}
              onChange={(countryId) => updateTemplate.mutate({ country_id: countryId })}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateTemplate.mutate(template.id, { onSuccess: (clone) => navigate(`/workflow/${clone.id}`) })}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
        </div>
      </div>

      {template.is_default && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
          <Badge variant="secondary">Default</Badge>
          Used automatically when an applicant's destination has no dedicated template.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                index={index}
                onClick={() => setSelectedStage(stage)}
                onToggleActive={(isActive) => {
                  setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, is_active: isActive } : s)));
                  updateStage.mutate({ stageId: stage.id, payload: { is_active: isActive } });
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {stages.length === 0 && (
        <EmptyState icon={WorkflowIcon} title="No stages yet" description="Add the first step of this journey to get started." />
      )}

      <Button
        variant="outline"
        className="mt-3 w-full border-dashed"
        onClick={() =>
          createStage.mutate({
            key: slugify(`stage-${stages.length + 1}-${Date.now().toString(36)}`),
            name: "New stage",
            color: STAGE_COLOR_PRESETS[0].value,
            icon: STAGE_ICON_PRESETS[0],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Add stage
      </Button>

      <StageEditorSheet
        templateId={templateId ?? ""}
        stage={selectedStage}
        open={Boolean(selectedStage)}
        onOpenChange={(open) => !open && setSelectedStage(null)}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Applicant timeline preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-0 overflow-y-auto">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="relative flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${stage.color ?? "#6B7280"}1A`, color: stage.color ?? "#6B7280" }}
                  >
                    <DynamicIcon name={stage.icon} className="h-3.5 w-3.5" />
                  </span>
                  {idx < stages.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                </div>
                <div className="pt-0.5">
                  <p className="text-[13px] font-medium text-foreground">{stage.name}</p>
                  {stage.description && <p className="text-xs text-muted-foreground">{stage.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
