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
import { STAGE_COLOR_PRESETS, STAGE_ICON_PRESETS, type RequirementCondition, type WorkflowStageRead } from "./types";
import type { StageConfig, StageKind } from "@/modules/application-journey/types";

/** What a stage asks of the student — `WorkflowStageKind` on the backend. */
const STAGE_KINDS: { value: StageKind; label: string; hint: string }[] = [
  { value: "info", label: "Staff only", hint: "No student action. Staff mark it complete." },
  {
    value: "documents",
    label: "Documents",
    hint: 'The student uploads the documents below, then submits. Settings: "level_aware": true for the stage the UG/PG/gap conditions and the gap question apply to; "on_complete_status".',
  },
  {
    value: "issued",
    label: "Issued by the university",
    hint: 'Completed when the status is recorded. Settings: "milestone_status": "offer_received" or "cas_received".',
  },
  {
    value: "review",
    label: "Counsellor review",
    hint: 'The student hands something in; staff verify or send back. Settings: "resources": [{"title","description","url"}], "allow_text", "allow_document", "allow_link", "accept": "document" | "video".',
  },
  {
    value: "booking",
    label: "Interview booking",
    hint: 'Staff offer slots, the student books, staff record the outcome. Settings: "allow_reschedule", "fail_ends_journey", "on_fail_status", "appointment_type".',
  },
  {
    value: "checklist",
    label: "Student checklist",
    hint: 'The student ticks tasks off. Settings: "tasks": [{"key","label"}], "on_complete_status".',
  },
];

const CONDITIONS: { value: RequirementCondition | "always"; label: string }[] = [
  { value: "always", label: "Always" },
  { value: "ug", label: "Undergraduate only" },
  { value: "pg", label: "Postgraduate only" },
  { value: "gap", label: "Study gap only" },
];

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
  const [newReqCondition, setNewReqCondition] = useState<RequirementCondition | "always">("always");
  const [configText, setConfigText] = useState("{}");
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setDescription(stage.description ?? "");
      setCategory(stage.category ?? "");
      setColor(stage.color ?? STAGE_COLOR_PRESETS[0].value);
      setIcon(stage.icon ?? STAGE_ICON_PRESETS[0]);
      setNewReqType("none");
      setNewReqLabel("");
      setNewReqCondition("always");
      setConfigText(JSON.stringify(stage.config ?? {}, null, 2));
      setConfigError(null);
    }
  }, [stage]);

  if (!stage) return null;

  function saveField(patch: Partial<{ name: string; description: string; category: string; color: string; icon: string }>) {
    updateStage.mutate({ stageId: stage!.id, payload: patch });
  }

  function saveConfig() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(configText || "{}");
    } catch {
      setConfigError("This isn't valid JSON.");
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setConfigError("Settings must be a JSON object, e.g. {}.");
      return;
    }
    setConfigError(null);
    updateStage.mutate({ stageId: stage!.id, payload: { config: parsed as StageConfig } });
  }

  const kindInfo = STAGE_KINDS.find((k) => k.value === stage.kind) ?? STAGE_KINDS[0];

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
            <Label>What the student does</Label>
            <Select
              value={stage.kind}
              onValueChange={(value) => updateStage.mutate({ stageId: stage.id, payload: { kind: value as StageKind } })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{kindInfo.hint}</p>
          </div>

          {stage.kind !== "info" && (
            <div className="space-y-1.5">
              <Label>Settings (JSON)</Label>
              <Textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                onBlur={saveConfig}
                rows={6}
                spellCheck={false}
                className="font-mono text-xs"
              />
              {configError && <p className="text-xs text-danger">{configError}</p>}
              <p className="text-xs text-muted-foreground">
                Changes apply to applications that start this journey from now on, and to steps already open.
              </p>
            </div>
          )}

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
                    {req.custom_label && req.document_type && (
                      <span className="ml-1.5 text-xs text-muted-foreground">“{req.custom_label}”</span>
                    )}
                    {!req.is_required && <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>}
                    {req.condition && (
                      <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {CONDITIONS.find((c) => c.value === req.condition)?.label}
                      </span>
                    )}
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
              <Input
                value={newReqLabel}
                onChange={(e) => setNewReqLabel(e.target.value)}
                placeholder={newReqType === "none" ? "Label" : "Label (optional)"}
                className="h-8 flex-1 text-xs"
              />
              <Select value={newReqCondition} onValueChange={(v) => setNewReqCondition(v as RequirementCondition | "always")}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                        custom_label: newReqLabel.trim() || undefined,
                        is_required: true,
                        condition: newReqCondition === "always" ? null : newReqCondition,
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
