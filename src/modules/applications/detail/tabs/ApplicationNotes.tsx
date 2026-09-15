import { useEffect, useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { StaffNameCell } from "@/modules/users/StaffNameCell";
import type { ApplicationWorkflowRead } from "@/modules/application-workflow/types";
import { formatRelativeTime } from "@/utils/format";
import { TabShell } from "./TabShell";

/**
 * Staff notes on this application.
 *
 * ## Why this is one field and not a feed
 *
 * The brief asks for a note list with authors, timestamps and internal /
 * student-visible flags. The backend has none of that: an application carries a
 * single `remarks` text column, and there is no application-notes table, no
 * author and no visibility flag. Inventing a feed on top of one string would
 * mean either fabricating authorship in the UI or writing a fake structure into
 * a free-text column that a counsellor may already be using as prose — so this
 * renders what actually exists, and says what it is.
 *
 * `remarks` is staff-only in practice: it is written through the staff
 * application endpoints and never returned to the student portal. That is
 * stated in the panel rather than implemented as a toggle, because a toggle
 * would imply a choice the backend cannot honour.
 *
 * The per-stage notes underneath are real and separate — they belong to
 * workflow steps and are edited on the Journey tab — so they are shown
 * read-only here, where someone looking for "what has been written down" will
 * expect to find them.
 */
export function ApplicationNotes({
  remarks,
  workflow,
  canManage,
  isSaving,
  onSave,
  autoFocus,
}: {
  remarks: string | null;
  workflow: ApplicationWorkflowRead | null | undefined;
  canManage: boolean;
  isSaving: boolean;
  onSave: (value: string) => void;
  autoFocus?: number;
}) {
  const [draft, setDraft] = useState(remarks ?? "");
  const [editing, setEditing] = useState(false);

  // Re-sync when the server value changes under us (another tab, another user).
  useEffect(() => {
    if (!editing) setDraft(remarks ?? "");
  }, [remarks, editing]);

  useEffect(() => {
    if (autoFocus) setEditing(true);
  }, [autoFocus]);

  const stepNotes = (workflow?.steps ?? []).filter((s) => s.notes?.trim());
  const dirty = draft.trim() !== (remarks ?? "").trim();

  return (
    <div className="space-y-4">
      <TabShell
        title="Notes"
        description="Internal to staff. These are never shown in the student portal."
        actions={
          canManage &&
          !editing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <NotebookPen className="h-3.5 w-3.5" /> {remarks ? "Edit note" : "Add note"}
            </Button>
          )
        }
      >
        {editing ? (
          <div className="space-y-3">
            <label htmlFor="application-note" className="sr-only">
              Application note
            </label>
            <Textarea
              id="application-note"
              autoFocus
              rows={8}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What should the next person picking this file up know?"
              className="text-[14.5px] leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={isSaving || !dirty} onClick={() => onSave(draft.trim())}>
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save note
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  setDraft(remarks ?? "");
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : remarks?.trim() ? (
          <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground">{remarks}</p>
        ) : (
          <EmptyState
            icon={NotebookPen}
            title="No notes yet"
            description="Record anything a colleague would need to know before picking this application up."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setEditing(true)}>
                  <NotebookPen className="h-3.5 w-3.5" /> Add note
                </Button>
              ) : undefined
            }
            className="border-none py-12"
          />
        )}
      </TabShell>

      {stepNotes.length > 0 && (
        <TabShell title="Stage notes" description="Written against individual journey stages. Edit them on the Journey tab.">
          <ul className="divide-y divide-border">
            {stepNotes.map((step) => (
              <li key={step.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[14px] font-medium text-foreground">{step.stage_name_snapshot}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {step.updated_by && <StaffNameCell userId={step.updated_by} />}
                    {step.updated_by && " · "}
                    {formatRelativeTime(step.updated_at)}
                  </p>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.notes}
                </p>
              </li>
            ))}
          </ul>
        </TabShell>
      )}
    </div>
  );
}
