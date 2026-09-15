import { Download, FileText, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { openAttachment } from "./hooks";
import type { ThreadAttachment, ThreadMessage } from "./types";

/**
 * A thread, laid out as correspondence.
 *
 * Deliberately not chat bubbles. This is the record of what was asked and
 * agreed on an application, re-read weeks later, and alternating rounded
 * bubbles are the wrong form for something you scan. Sender is signalled by a
 * left border and a tint, never by which side of the pane it sits on.
 *
 * `body_html` is rendered where present because the server sanitises it on
 * *write* — an allowlist of the four things the composer can produce, rebuilt
 * rather than filtered (`app/core/sanitize.py`). Sanitising on read instead
 * would mean every renderer had to remember to, and the one that forgot would
 * be a stored XSS against whoever opened the thread next.
 */

const bytes = (size: number | null) => {
  if (size === null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1_048_576) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
};

function Attachment({ attachment }: { attachment: ThreadAttachment }) {
  const isVoice = attachment.kind === "voice";
  const Icon = isVoice ? Mic : attachment.kind === "image" ? Paperclip : FileText;
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate text-[13px] font-medium text-foreground">
          {isVoice ? "Voice note" : attachment.original_file_name}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {isVoice && attachment.duration_seconds
            ? `${Math.round(attachment.duration_seconds)}s`
            : bytes(attachment.file_size)}
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 shrink-0 text-xs"
        onClick={() => void openAttachment(attachment.id, isVoice ? "inline" : "attachment")}
      >
        <Download className="h-3 w-3" /> {isVoice ? "Play" : "Open"}
      </Button>
    </li>
  );
}

export function ThreadTimeline({ messages }: { messages: ThreadMessage[] }) {
  return (
    <ol className="divide-y divide-border">
      {messages.map((message) => (
        <li key={message.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[13px] font-semibold text-foreground">
              {message.is_from_student ? message.author_name || "Applicant" : message.author_name || "Ignition"}
              {message.is_from_student && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Applicant
                </span>
              )}
            </p>
            <time dateTime={message.created_at} className="text-xs tabular-nums text-muted-foreground">
              {formatDateTime(message.created_at)}
            </time>
          </div>

          <div
            className={cn(
              "mt-2 rounded-lg border-l-[3px] pl-3.5 pr-3",
              message.is_from_student ? "border-l-primary/40 bg-primary/[0.04]" : "border-l-border bg-muted/40",
            )}
          >
            {message.body_html ? (
              <div
                className="py-2 text-[13.5px] leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
                // Safe: sanitised server-side on write. See the note above.
                dangerouslySetInnerHTML={{ __html: message.body_html }}
              />
            ) : (
              <p className="whitespace-pre-wrap py-2 text-[13.5px] leading-relaxed text-foreground">
                {message.body}
              </p>
            )}
          </div>

          {message.attachments.length > 0 && (
            <ul className="mt-2.5 space-y-2">
              {message.attachments.map((attachment) => (
                <Attachment key={attachment.id} attachment={attachment} />
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
