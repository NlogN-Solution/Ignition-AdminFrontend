import { useRef, useState } from "react";
import { Bold, Italic, Link2, List, Loader2, Mic, Paperclip, Send, Square, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThreadReplyPayload } from "./types";

/**
 * The reply box: rich text, files, a voice note.
 *
 * `contentEditable` + `document.execCommand` rather than an editor
 * dependency, because what is needed is bold, italic, a list and a link — and
 * a 200KB bundle for four commands is the tail wagging the dog.
 *
 * Both a plain-text `body` and a `body_html` are sent. The plain text is what
 * previews, search and notifications read and what renders if the HTML is
 * unavailable; neither is derived from the other at read time.
 */

const MAX_ATTACHMENTS = 10;
const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

const supportedAudioType = () => {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") return null;
  return AUDIO_TYPES.find((type) => window.MediaRecorder.isTypeSupported?.(type)) ?? "";
};

const duration = (seconds: number) => {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

export function ThreadComposer({
  onSend,
  isSending,
  placeholder = "Write a reply…",
}: {
  onSend: (payload: ThreadReplyPayload) => Promise<unknown>;
  isSending: boolean;
  placeholder?: string;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [voice, setVoice] = useState<ThreadReplyPayload["voice"]>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);

  const audioType = supportedAudioType();

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editor.current?.focus();
    setIsEmpty(!editor.current?.textContent?.trim());
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const instance = new MediaRecorder(stream, audioType ? { mimeType: audioType } : undefined);
      chunks.current = [];
      instance.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      instance.onstop = () => {
        const type = instance.mimeType || audioType || "audio/webm";
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        setVoice({
          blob: new Blob(chunks.current, { type }),
          name: `voice-note.${extension}`,
          durationSeconds: (Date.now() - startedAt.current) / 1000,
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      instance.start();
      recorder.current = instance;
      startedAt.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      ticker.current = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 250);
    } catch {
      /* microphone denied or absent — the button simply does nothing */
    }
  };

  const stopRecording = () => {
    if (ticker.current) clearInterval(ticker.current);
    recorder.current?.stop();
    setIsRecording(false);
  };

  const send = async () => {
    const node = editor.current;
    const body = (node?.textContent ?? "").trim();
    if (!body && !voice && files.length === 0) return;

    await onSend({
      body: body || (voice ? "Voice note" : "Attachment"),
      body_html: body ? (node?.innerHTML ?? null) : null,
      files,
      voice,
    });

    if (node) node.innerHTML = "";
    setFiles([]);
    setVoice(null);
    setIsEmpty(true);
  };

  const canSend = !isSending && (!isEmpty || Boolean(voice) || files.length > 0);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
        {(
          [
            [Bold, "Bold", () => exec("bold")],
            [Italic, "Italic", () => exec("italic")],
            [List, "Bulleted list", () => exec("insertUnorderedList")],
            [
              Link2,
              "Insert link",
              () => {
                const href = window.prompt("Link to:");
                if (href) exec("createLink", href);
              },
            ],
          ] as const
        ).map(([Icon, label, action]) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => {
              // preventDefault keeps the caret in the editable region; a plain
              // click blurs it first and execCommand then does nothing.
              event.preventDefault();
              action();
            }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <button
          type="button"
          title="Attach a file"
          aria-label="Attach a file"
          onClick={() => fileInput.current?.click()}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const room = MAX_ATTACHMENTS - files.length - (voice ? 1 : 0);
            setFiles((current) => [...current, ...Array.from(event.target.files ?? []).slice(0, Math.max(0, room))]);
            event.target.value = "";
          }}
        />
      </div>

      <div className="relative">
        {isEmpty && (
          <p className="pointer-events-none absolute left-3.5 top-3 text-[13.5px] text-muted-foreground">
            {placeholder}
          </p>
        )}
        <div
          ref={editor}
          role="textbox"
          aria-multiline="true"
          aria-label="Message"
          contentEditable
          suppressContentEditableWarning
          tabIndex={0}
          onInput={(event) => setIsEmpty(!event.currentTarget.textContent?.trim())}
          onPaste={(event) => {
            // Plain text only — pasting from Word otherwise brings a
            // stylesheet and the thread stops looking like one conversation.
            event.preventDefault();
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (canSend) void send();
            }
          }}
          className="max-h-[260px] min-h-[84px] overflow-y-auto px-3.5 py-3 text-[13.5px] leading-relaxed text-foreground outline-none [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2 border-t border-border px-3 py-2.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 py-1 pl-2.5 pr-1 text-xs font-medium text-foreground"
            >
              <span className="max-w-[160px] truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                className="rounded p-1 text-muted-foreground transition-colors hover:text-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2.5">
        {audioType === null ? (
          <span />
        ) : voice ? (
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground">
            <Mic className="h-3.5 w-3.5" /> Voice note · {duration(voice.durationSeconds)}
            <button
              type="button"
              aria-label="Discard voice note"
              onClick={() => setVoice(null)}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-danger"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 text-xs", isRecording && "border-danger/40 text-danger")}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <>
                <Square className="h-3 w-3" /> <span className="tabular-nums">{duration(elapsed)}</span>
              </>
            ) : (
              <>
                <Mic className="h-3 w-3" /> Voice note
              </>
            )}
          </Button>
        )}

        <Button size="sm" className="h-8" disabled={!canSend} onClick={() => void send()}>
          {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send
        </Button>
      </div>
    </div>
  );
}
