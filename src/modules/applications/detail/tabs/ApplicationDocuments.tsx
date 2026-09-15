import { DocumentChecklistCard } from "@/modules/checklist/DocumentChecklistCard";

/**
 * The document checklist, given the whole panel.
 *
 * `DocumentChecklistCard` already does everything §12 of the brief asks for —
 * the X-of-Y summary, the progress bar, the request-document action, per-row
 * status badges, upload and verify — so it is rendered as-is rather than
 * reimplemented. What changed is that it is no longer squeezed into a third of
 * the Overview grid beside the journey.
 *
 * The `requestSignal` prop lets the Quick Actions card on Overview open this
 * tab's request dialog: the button lives on one screen and the dialog on
 * another, and this is the seam between them.
 */
export function ApplicationDocuments({
  applicationId,
  studentId,
  requestSignal,
}: {
  applicationId: string;
  studentId: string;
  requestSignal?: number;
}) {
  return <DocumentChecklistCard applicationId={applicationId} studentId={studentId} requestSignal={requestSignal} />;
}
