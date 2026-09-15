import { useEffect, useState } from "react";
import { Mail, MailOpen, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadComposer } from "@/modules/communication/ThreadComposer";
import { ThreadTimeline } from "@/modules/communication/ThreadTimeline";
import { useInbox, useReplyToThread, useThread } from "@/modules/communication/hooks";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * The console mailbox.
 *
 * ## What this replaces
 *
 * A chat pane keyed by `student_id`, with a WhatsApp button beside it. Three
 * things were wrong with that and all three mattered:
 *
 * 1. **One unsubjected stream per student.** Unsearchable past a screen, and an
 *    instruction about documents looked identical to "hi".
 * 2. **Students only.** A lead had no conversation here at all — theirs lived
 *    in `lead_activities`, a different table with a different shape — so
 *    converting a lead produced an empty inbox for somebody staff had been
 *    talking to for weeks.
 * 3. **WhatsApp.** Pressing it moved the record of what was agreed somewhere
 *    the application cannot see, cannot search and cannot show the student.
 *    It is gone, not hidden.
 *
 * This lists every thread — lead-stage and student-stage together, because
 * they are the same people — with a subject, a search, and unread counts that
 * mean "unread by staff" rather than a single shared flag that could not
 * answer both sides.
 */

export function CommunicationPage() {
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useInbox({ search: search || undefined, unread_only: unreadOnly });
  const { data: thread } = useThread(selectedId);
  const reply = useReplyToThread(selectedId ?? "");

  const threads = data?.items ?? [];

  useEffect(() => {
    if (!selectedId && threads.length > 0) setSelectedId(threads[0].id);
  }, [selectedId, threads]);

  return (
    <div>
      <PageHeader
        title="Communication"
        description="Every conversation with every applicant, from first enquiry to enrolment — one history per person, whatever stage they are at."
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* --------------------------------------------------- thread list --- */}
        <aside className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subjects and messages"
                aria-label="Search correspondence"
                className="h-9 pl-8 text-[13px]"
              />
            </div>
            <Button
              variant={unreadOnly ? "default" : "outline"}
              size="sm"
              className="h-7 w-full text-xs"
              onClick={() => setUnreadOnly((value) => !value)}
            >
              {unreadOnly ? "Showing unread only" : "Show unread only"}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="Nothing here"
              description={
                search || unreadOnly
                  ? "No conversations match that filter."
                  : "Applicant messages and anything you send will appear here."
              }
              className="border-none py-10"
            />
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {threads.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    aria-current={item.id === selectedId ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-accent",
                      item.id === selectedId && "bg-accent",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[13px] font-semibold text-foreground">
                        {item.participant.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelativeTime(item.last_message_at)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "min-w-0 truncate text-[12.5px]",
                        item.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.subject}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {item.participant.stage}
                      </span>
                      {item.unread_count > 0 && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10.5px] font-bold text-primary-foreground">
                          {item.unread_count} new
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* --------------------------------------------------- conversation --- */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          {thread ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-foreground">{thread.subject}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {thread.participant.name}
                    {thread.participant.email ? ` · ${thread.participant.email}` : ""}
                    {` · ${thread.participant.stage}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {thread.message_count} {thread.message_count === 1 ? "message" : "messages"}
                </span>
              </div>

              <div className="mt-4 max-h-[calc(100vh-24rem)] overflow-y-auto pr-1">
                <ThreadTimeline messages={thread.messages} />
              </div>

              <div className="mt-4">
                <ThreadComposer
                  isSending={reply.isPending}
                  onSend={(payload) => reply.mutateAsync(payload)}
                />
              </div>
            </>
          ) : isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <EmptyState
              icon={MailOpen}
              title="Nothing selected"
              description="Pick a conversation on the left."
              className="border-none py-16"
            />
          )}
        </section>
      </div>
    </div>
  );
}
