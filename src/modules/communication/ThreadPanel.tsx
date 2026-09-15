import { useEffect, useState } from "react";
import { Lock, MessageSquarePlus, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { ThreadComposer } from "./ThreadComposer";
import { ThreadTimeline } from "./ThreadTimeline";
import { useCreateThread, useReplyToThread, useThread } from "./hooks";
import type { Thread } from "./types";

/**
 * Correspondence for one person or one application, as a tab.
 *
 * The same component backs the lead page, the student page and the application
 * page. That is the point of Phase 5 expressed in a file: three screens that
 * used to imply three stores are three views of one, and giving them one
 * component makes it impossible for them to drift into disagreeing.
 *
 * It takes the *threads* rather than fetching them, because who "this person"
 * is differs per host — a lead id, a user id, an application id — and that
 * resolution belongs to the hook the host already calls.
 */
export function ThreadPanel({
  threads,
  isLoading,
  target,
  emptyDescription,
  allowInternal = true,
}: {
  threads: Thread[] | undefined;
  isLoading: boolean;
  /** Who a new thread would be opened against. */
  target: { studentId?: string | null; leadId?: string | null; applicationId?: string | null };
  emptyDescription: string;
  allowInternal?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: thread } = useThread(selectedId);
  const reply = useReplyToThread(selectedId ?? "");
  const createThread = useCreateThread();

  // Land on the most recent conversation rather than an empty pane.
  useEffect(() => {
    if (!selectedId && threads && threads.length > 0) setSelectedId(threads[0].id);
  }, [selectedId, threads]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-foreground">Communication</h2>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsComposing(true)}>
          <Plus className="h-3 w-3" /> New thread
        </Button>
      </div>

      {!threads || threads.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No correspondence yet"
          description={emptyDescription}
          className="border-none py-8"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <ul className="divide-y divide-border rounded-xl border border-border">
            {threads.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-current={item.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                    item.id === selectedId && "bg-accent",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {item.visibility === "internal" && (
                      <Lock className="h-3 w-3 shrink-0 text-warning" aria-label="Internal note" />
                    )}
                    <span
                      className={cn(
                        "min-w-0 truncate text-[13px]",
                        item.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.subject}
                    </span>
                    {item.unread_count > 0 && (
                      <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 text-[10.5px] font-bold text-primary-foreground">
                        {item.unread_count}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(item.last_message_at)}
                    {/* Said out loud, because it is the thing that used to be
                        impossible: this conversation predates the account. */}
                    {item.participant.stage === "student (from lead)" && " · from lead stage"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <section className="rounded-xl border border-border p-4">
            {thread ? (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-foreground">{thread.subject}</h3>
                  <span className="text-xs text-muted-foreground">{thread.participant.stage}</span>
                </div>
                {thread.visibility === "internal" && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2 py-1 text-[11.5px] font-medium text-warning">
                    <Lock className="h-3 w-3" /> Internal — the applicant cannot see this
                  </p>
                )}
                <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
                  <ThreadTimeline messages={thread.messages} />
                </div>
                <div className="mt-4">
                  <ThreadComposer
                    isSending={reply.isPending}
                    onSend={(payload) => reply.mutateAsync(payload)}
                  />
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Select a conversation.</p>
            )}
          </section>
        </div>
      )}

      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New thread</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-thread-subject">Subject</Label>
              <Input
                id="new-thread-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Documents required for your application"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-thread-body">Message</Label>
              <Textarea
                id="new-thread-body"
                rows={5}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
            {allowInternal && (
              <label className="flex items-start gap-2.5 rounded-lg border border-border p-3">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(event) => setIsInternal(event.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[12.5px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Internal note.</span> Staff only — the
                  applicant never sees it, in their portal or anywhere else.
                </span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposing(false)}>
              Cancel
            </Button>
            <Button
              disabled={!subject.trim() || !body.trim() || createThread.isPending}
              onClick={() =>
                createThread.mutate(
                  {
                    subject: subject.trim(),
                    body: body.trim(),
                    student_id: target.studentId ?? null,
                    lead_id: target.leadId ?? null,
                    application_id: target.applicationId ?? null,
                    visibility: isInternal ? "internal" : "shared",
                  },
                  {
                    onSuccess: (created) => {
                      setIsComposing(false);
                      setSubject("");
                      setBody("");
                      setIsInternal(false);
                      setSelectedId(created.id);
                    },
                  },
                )
              }
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
