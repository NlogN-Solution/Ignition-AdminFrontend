import type { ApplicationRead, StatusRequirement } from "@/modules/applications/types";
import { ApplicationStatus } from "@/types/enums";
import { ApplicationSnapshot } from "../overview/ApplicationSnapshot";
import { AcceptRequest } from "../overview/AcceptRequest";
import { MilestoneEvidence } from "../overview/MilestoneEvidence";
import { NextSteps } from "../overview/NextSteps";

/**
 * The default screen: what this application is, and what to do about it.
 *
 * It has lost three cards since the first pass. Quick Actions went because
 * every one of its buttons duplicated a control that already existed somewhere
 * more obvious — request document is on the Documents tab, add note on Notes,
 * update status and assign advisor in the header's Actions menu — and a panel
 * of shortcuts to things one click away is a panel earning its space in
 * aliases. Latest Update went because it was the first row of the Status
 * History tab, printed twice.
 *
 * The third is the pair of standing "Offer" and "CAS" panels, now one
 * `MilestoneEvidence` card that shows what the current status is actually
 * waiting on and lists what is already on file underneath it. The reason those
 * two were sections at all was that recording an offer needed a screen of its
 * own; it does not any more — changing the status collects the date and the
 * letter where you already are.
 *
 * What is left is the record, the evidence, and the next action, which is what
 * a summary is.
 */
export function ApplicationOverview({
  application,
  programName,
  universityName,
  applicantPhone,
  canManage,
  requirements,
  onEdit,
  onAssignAdvisor,
  onRecordMilestone,
  onAcceptRequest,
  isAccepting,
}: {
  application: ApplicationRead;
  programName: string | null;
  universityName: string | null;
  applicantPhone?: string | null;
  canManage: boolean;
  requirements: StatusRequirement[];
  onEdit: () => void;
  onAssignAdvisor: () => void;
  onRecordMilestone: (status: ApplicationStatus) => void;
  onAcceptRequest: () => void;
  isAccepting: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Above the snapshot, because until this is answered the snapshot is a
          description of a file nobody has agreed to open. */}
      {canManage && application.status === ApplicationStatus.REQUESTED && (
        <AcceptRequest onAccept={onAcceptRequest} isAccepting={isAccepting} />
      )}

      <ApplicationSnapshot
        application={application}
        programName={programName}
        universityName={universityName}
        applicantPhone={applicantPhone}
        canManage={canManage}
        onEdit={onEdit}
        onAssignAdvisor={onAssignAdvisor}
      />

      {canManage && (
        <MilestoneEvidence
          application={application}
          requirements={requirements}
          onRecord={onRecordMilestone}
        />
      )}

      <NextSteps status={application.status} />
    </div>
  );
}
