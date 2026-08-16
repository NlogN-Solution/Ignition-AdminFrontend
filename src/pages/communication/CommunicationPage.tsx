import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMarkThreadRead, useMessageThread, useMessageThreads, useSendMessage } from "@/modules/messages/hooks";
import { useAuthStore } from "@/services/authStore";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function ThreadList({
  selectedStudentId,
  onSelect,
}: {
  selectedStudentId: string | null;
  onSelect: (studentId: string) => void;
}) {
  const { data: threads, isLoading } = useMessageThreads({ refetchInterval: 20_000 });

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading conversations…</div>;
  }

  if (!threads || threads.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description="Student messages will show up here."
        className="border-none py-10"
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {threads.map((thread) => (
          <button
            key={thread.student_id}
            type="button"
            onClick={() => onSelect(thread.student_id)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
              selectedStudentId === thread.student_id && "bg-accent",
            )}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback>{initials(thread.student_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{thread.student_name}</span>
                <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                  {formatRelativeTime(thread.last_message_at)}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {thread.last_message_from_student ? "" : "You: "}
                {thread.last_message}
              </p>
            </div>
            {thread.unread_count > 0 && (
              <Badge className="flex-shrink-0" variant="default">
                {thread.unread_count}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadDetail({ studentId, studentName }: { studentId: string; studentName: string }) {
  const staff = useAuthStore((s) => s.user);
  const { data, isLoading } = useMessageThread(studentId, { refetchInterval: 10_000 });
  const sendMessage = useSendMessage(studentId);
  const markRead = useMarkThreadRead();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    markRead.mutate(studentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    sendMessage.mutate(body, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground">{studentName}</p>
      </div>

      {/* A plain scrolling div, not Radix's ScrollArea — its Viewport wraps
          children in an internal `display: table` element (to measure
          scroll size) that auto-sizes to content width, so a `max-w-[75%]`
          bubble computes against that expanding table instead of the visible
          panel and grows past its edge. Native overflow doesn't have that
          quirk. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            data?.items.map((message) => (
              <div key={message.id} className={cn("flex", message.is_from_student ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[75%] min-w-0 rounded-2xl px-4 py-2 text-sm break-words",
                    message.is_from_student
                      ? "rounded-bl-sm bg-accent text-accent-foreground"
                      : "rounded-br-sm bg-primary text-primary-foreground",
                  )}
                >
                  {!message.is_from_student && message.sender && (
                    <p className="mb-1 text-[11px] font-medium opacity-80">{message.sender.full_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className="mt-1 text-[10px] opacity-70">{formatRelativeTime(message.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Reply as ${staff ? `${staff.first_name} ${staff.last_name}` : "staff"}…`}
          className="min-h-[44px] flex-1 resize-none"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={!draft.trim() || sendMessage.isPending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CrmMessageTab() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const { data: threads } = useMessageThreads();

  const selectedStudentName = useMemo(
    () => threads?.find((t) => t.student_id === selectedStudentId)?.student_name ?? "",
    [threads, selectedStudentId],
  );

  return (
    <div className="grid h-[min(70vh,44rem)] min-h-[420px] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <ThreadList selectedStudentId={selectedStudentId} onSelect={setSelectedStudentId} />
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        {selectedStudentId ? (
          <ThreadDetail studentId={selectedStudentId} studentName={selectedStudentName} />
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Select a conversation"
            description="Pick a student from the list to view and reply to their messages."
            className="h-full border-none"
          />
        )}
      </div>
    </div>
  );
}

export function CommunicationPage() {
  return (
    <div>
      <PageHeader title="Communication" description="Message students, and — soon — email and WhatsApp, all from one place." />
      <Tabs defaultValue="message">
        <TabsList>
          <TabsTrigger value="message">
            <MessageCircle className="h-3.5 w-3.5" /> CRM Message
          </TabsTrigger>
          <TabsTrigger value="email" disabled>
            <Mail className="h-3.5 w-3.5" /> Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp" disabled>
            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
          </TabsTrigger>
        </TabsList>
        <TabsContent value="message" className="mt-4">
          <CrmMessageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
