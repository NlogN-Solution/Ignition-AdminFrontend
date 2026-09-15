import { ApplicationJourneyPanel } from "../ApplicationJourneyPanel";
import type { ApplicationWorkflowRead, ApplicationWorkflowStepRead } from "@/modules/application-workflow/types";
import type { ApplicationStatus, WorkflowStepStatus } from "@/types/enums";

/**
 * The journey, as its own section again.
 *
 * It spent one revision as a permanent rail down the right of the workspace.
 * That kept it visible from every tab, but it cost the content a whole column —
 * the Application Snapshot lost a third of its width to a panel most of whose
 * rows say "Upcoming". As a tab it gets the full width when you want it and
 * none when you do not, which is the same bargain every other section makes.
 *
 * The panel component is unchanged and still does the editing — this is a
 * placement change, not a rewrite. `wide` tells it to lay its stages out with
 * the room a full column gives rather than the 300px rail it was drawn for.
 */
export function ApplicationJourney(props: {
  workflow: ApplicationWorkflowRead | null | undefined;
  isLoading: boolean;
  status: ApplicationStatus;
  canManage: boolean;
  isStarting: boolean;
  isUpdating: boolean;
  onStart: () => void;
  onSelectStep: (step: ApplicationWorkflowStepRead) => void;
  onSetStepStatus: (stepId: string, status: WorkflowStepStatus) => void;
}) {
  return <ApplicationJourneyPanel {...props} wide />;
}
