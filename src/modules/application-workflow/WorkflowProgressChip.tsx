import { Route } from "lucide-react";
import { useApplicationWorkflow } from "./hooks";
import { WorkflowStepStatus } from "@/types/enums";

export function WorkflowProgressChip({ applicationId }: { applicationId: string }) {
  const { data: workflow } = useApplicationWorkflow(applicationId);
  if (!workflow || workflow.steps.length === 0) return null;

  const completed = workflow.steps.filter((s) => s.status === WorkflowStepStatus.COMPLETED).length;
  const current = workflow.steps.find((s) => s.status === WorkflowStepStatus.CURRENT);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      <Route className="h-3 w-3" />
      Step {completed + (current ? 1 : 0)}/{workflow.steps.length}
      {current && <span className="text-foreground">· {current.stage_name_snapshot}</span>}
    </span>
  );
}
