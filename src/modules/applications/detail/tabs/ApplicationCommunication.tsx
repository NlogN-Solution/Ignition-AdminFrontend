import { Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadPanel } from "@/modules/communication/ThreadPanel";
import { useApplicationThreads } from "@/modules/communication/hooks";
import { TabShell } from "./TabShell";

/**
 * Correspondence about this application.
 *
 * ## What changed, and why WhatsApp is gone
 *
 * This tab used to be two big buttons: WhatsApp and email. Both opened
 * somewhere else. That is a reasonable design for a contact card and a bad one
 * for a system of record — a conversation held on WhatsApp cannot be searched
 * here, cannot be shown to the student in their portal, and does not survive
 * the counsellor leaving. The most important thing anyone ever agreed about an
 * application was, structurally, the thing the application could not see.
 *
 * So the thread panel is the channel now, and it is the *same* store the lead
 * page, the student page and the student's own mailbox read. The phone number
 * and email address stay on screen as facts — a counsellor about to ring
 * somebody still needs the number — but they are details, not the interface.
 */
export function ApplicationCommunication({
  applicationId,
  studentId,
  phone,
  email,
  programName,
  studentName,
  isLoading,
}: {
  applicationId: string;
  studentId: string;
  phone: string | null | undefined;
  email: string | null | undefined;
  programName: string;
  studentName: React.ReactNode;
  isLoading: boolean;
}) {
  const { data: threads, isLoading: threadsLoading } = useApplicationThreads(applicationId);

  return (
    <TabShell
      title="Communication"
      description="Correspondence about this application. The applicant sees these in their portal."
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px]">
            <span className="font-medium text-foreground">{studentName}</span>
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5" /> {email}
              </a>
            )}
          </div>

          <ThreadPanel
            threads={threads}
            isLoading={threadsLoading}
            target={{ studentId, applicationId }}
            emptyDescription={`Nothing has been written about ${programName} yet. Open a thread and the applicant sees it in their portal.`}
          />
        </>
      )}
    </TabShell>
  );
}
