import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { cn } from "@/lib/utils";
import { DocumentType } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useCreateRequirement, useDeleteRequirement, useDeleteStage, useUpdateStage } from "./hooks";
import { STAGE_COLOR_PRESETS, STAGE_ICON_PRESETS, type WorkflowStageRead } from "./types";

export function StageEditorSheet({
  templateId,
  stage,
  open,
  onOpenChange,
}: {
  templateId: string;
  stage: WorkflowStageRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateStage = useUpdateStage(templateId);
  const deleteStage = useDeleteStage(templateId);
  const createRequirement = useCreateRequirement(templateId);
  const deleteRequirement = useDeleteRequirement(templateId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState<string>(STAGE_COLOR_PRESETS[0].value);
  const [icon, setIcon] = useState<string>(STAGE_ICON_PRESETS[0]);
  const [newReqType, setNewReqType] = useState<string>("none");
  const [newReqLabel, setNewReqLabel] = useState("");

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setDescription(stage.description ?? "");
      setCategory(stage.category ?? "");
      setColor(stage.color ?? STAGE_COLOR_PRESETS[0].value);
      setIcon(stage.icon ?? STAGE_ICON_PRESETS[0]);
      setNewReqType("none");
      setNewReqLabel("");
    }
  }, [stage]);

  if (!stage) return null;

  function saveField(patch: Partial<{ name: string; description: string; category: string; color: string; icon: string }>) {
    updateStage.mutate({ stageId: stage!.id, payload: patch });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit stage</SheetTitle>
          <SheetDescription>Changes save automatically.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4">
          <div className="space-y-1.5">
            <Label>Stage name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => saveField({ name })} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => saveField({ description })}
              rows={2}
              placeholder="Optional — shown in the applicant's timeline"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={() => saveField({ category })}
              placeholder="e.g. documentation, visa, travel"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {STAGE_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => {
                    setColor(preset.value);
                    saveField({ color: preset.value });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
                  style={{ backgroundColor: preset.value }}
                >
                  {color === preset.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {STAGE_ICON_PRESETS.map((presetIcon) => (
                <button
                  key={presetIcon}
                  type="button"
                  onClick={() => {
                    setIcon(presetIcon);
                    saveField({ icon: presetIcon });
                  }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                    icon === presetIcon ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <DynamicIcon name={presetIcon} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">Inactive stages are skipped when a new journey starts.</p>
            </div>
            <Switch
              checked={stage.is_active}
              onCheckedChange={(checked) => updateStage.mutate({ stageId: stage.id, payload: { is_active: checked } })}
            />
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label>Required documents</Label>
            <div className="space-y-1.5">
              {stage.document_requirements.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5">
                  <span className="text-sm text-foreground">
                    {req.document_type ? toTitleCase(req.document_type) : req.custom_label}
                    {!req.is_required && <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-danger"
                    onClick={() => deleteRequirement.mutate({ stageId: stage.id, requirementId: req.id })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {stage.document_requirements.length === 0 && <p className="text-xs text-muted-foreground">No documents required at this stage.</p>}
            </div>

            <div className="flex items-end gap-2 pt-1">
              <Select value={newReqType} onValueChange={setNewReqType}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Custom label…</SelectItem>
                  {Object.values(DocumentType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newReqType === "none" && (
                <Input value={newReqLabel} onChange={(e) => setNewReqLabel(e.target.value)} placeholder="Label" className="h-8 flex-1 text-xs" />
              )}
              <Button
                size="sm"
                className="h-8"
                disabled={newReqType === "none" && !newReqLabel}
                onClick={() => {
                  createRequirement.mutate(
                    {
                      stageId: stage.id,
                      payload: {
                        document_type: newReqType === "none" ? undefined : (newReqType as DocumentType),
                        custom_label: newReqType === "none" ? newReqLabel : undefined,
                        is_required: true,
                      },
                    },
                    { onSuccess: () => setNewReqLabel("") },
                  );
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            className="text-danger hover:text-danger"
            onClick={() => {
              if (confirm(`Remove "${stage.name}" from this template?`)) {
                deleteStage.mutate(stage.id, { onSuccess: () => onOpenChange(false) });
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove stage
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
