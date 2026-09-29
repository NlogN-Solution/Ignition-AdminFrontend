import { useState } from "react";
import { Check, Inbox, Loader2, MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationRead } from "@/modules/applications/types";
import { ApplicationStatus } from "@/types/enums";
import { formatDateTime } from "@/utils/format";

/**
 * The one thing to do with an application nobody has accepted yet: decide.
 *
 * A student opening an application from a course page creates it as
 * `requested`. Registration is free, so a request can come from someone with
 * no academic history or certificates on file — or from nobody real at all —
 * and it cannot simply be taken on. Until a counsellor decides, nothing else on
 * the application can be edited, assigned or moved (the backend refuses it),
 * so the Overview leads with the decision.
 *
 * - **Accept** moves it to `draft`, where "Preparing" starts. The note is
 *   optional and shown to the student with the acceptance.
 * - **Reject** moves it to `request_rejected` and out of the working list. The
 *   feedback is required — it is what the student needs to supply before this
 *   can be accepted — and they see it on the application.
 *
 * A rejected request keeps this panel, showing what was asked for, with Accept
 * still offered: once the student has supplied it, the counsellor takes the
 * same request on rather than waiting for a new one.
 */
export function AcceptRequest({
  application,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: {
  application: ApplicationRead;
  onAccept: (feedback: string, done: () => void) => void;
  onReject: (feedback: string, done: () => void) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}) {
  const [mode, setMode] = useState<"accept" | "reject" | null>(null);
  const [feedback, setFeedback] = useState("");
  const isRejected = application.status === ApplicationStatus.REQUEST_REJECTED;
  const isPending = mode === "accept" ? isAccepting : isRejecting;

  function open(next: "accept" | "reject") {
    setFeedback("");
    setMode(next);
  }

  function submit() {
    const done = () => setMode(null);
    if (mode === "accept") onAccept(feedback.trim(), done);
    else if (mode === "reject" && feedback.trim()) onReject(feedback.trim(), done);
  }

  return (
    <section
      className={
        isRejected
          ? "rounded-2xl border border-danger/25 bg-danger/[0.04] px-5 py-4 sm:px-6"
          : "rounded-2xl border border-primary/25 bg-primary/[0.04] px-5 py-4 sm:px-6"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className={
              isRejected
                ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger"
                : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            }
          >
            {isRejected ? (
              <MessageSquareWarning className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Inbox className="h-4 w-4" strokeWidth={2} />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="text-[14.5px] font-semibold text-foreground">
              {isRejected ? "You rejected this request" : "This application request is waiting for you"}
            </h2>
            <p className="mt-0.5 max-w-[70ch] text-[13.5px] leading-relaxed text-muted-foreground">
              {isRejected
                ? "The student has been told what is missing. When they have supplied it, accept the request to start work on it."
                : "The student asked to apply and nobody has reviewed it yet. Check their profile and documents, then accept it or reject it with what they need to do. Nothing else on this application can be changed until you decide."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isRejected && (
            <Button variant="outline" className="gap-1.5 text-danger" onClick={() => open("reject")}>
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          )}
          <Button className="gap-1.5" onClick={() => open("accept")}>
            <Check className="h-3.5 w-3.5" />
            {isRejected ? "Accept now" : "Accept"}
          </Button>
        </div>
      </div>

      {isRejected && application.review_feedback && (
        <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            What you asked for
            {application.reviewed_at && (
              <span className="ml-2 normal-case tracking-normal">· {formatDateTime(application.reviewed_at)}</span>
            )}
          </p>
          <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-foreground">
            {application.review_feedback}
          </p>
        </div>
      )}

      <Dialog open={mode !== null} onOpenChange={(next) => !next && setMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "accept" ? "Accept this application request" : "Reject this application request"}</DialogTitle>
            <DialogDescription>
              {mode === "accept"
                ? "Work starts on the application and the student is told. Anything you write here is shown to them too."
                : "The request leaves the applications list and the student is told what they need to do. You can still accept it later."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="request-feedback">
              {mode === "accept" ? "Feedback or next steps (optional)" : "What the student needs to do"}
            </Label>
            <Textarea
              id="request-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              maxLength={4000}
              autoFocus
              placeholder={
                mode === "accept"
                  ? "e.g. Great choice — I'll be in touch this week about your personal statement."
                  : "e.g. Please upload your final transcript and passport, and add your IELTS score to your profile."
              }
            />
            <p className="text-xs text-muted-foreground">Visible to the student on their application.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button
              variant={mode === "reject" ? "destructive" : "default"}
              disabled={isPending || (mode === "reject" && !feedback.trim())}
              onClick={submit}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "accept" ? "Accept request" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
