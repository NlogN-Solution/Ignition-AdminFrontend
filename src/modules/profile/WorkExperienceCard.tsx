import { useEffect, useState } from "react";
import { Briefcase, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useAddExperience,
  useRemoveExperience,
  useUpdateExperience,
  useWorkExperience,
} from "@/modules/users/hooks";
import type { StudentWorkExperienceRead } from "@/modules/users/types";
import { formatDate } from "@/utils/format";

function ExperienceEntryDialog({
  userId,
  entry,
  open,
  onOpenChange,
}: {
  userId: string;
  entry: StudentWorkExperienceRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddExperience(userId);
  const update = useUpdateExperience(userId);
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setCompany(entry?.company_name ?? "");
      setTitle(entry?.job_title ?? "");
      setStartDate(entry?.start_date ?? "");
      setEndDate(entry?.end_date ?? "");
      setIsCurrent(entry?.is_current ?? false);
      setDescription(entry?.description ?? "");
    }
  }, [open, entry]);

  const isPending = add.isPending || update.isPending;

  function handleSubmit() {
    const payload = {
      company_name: company,
      job_title: title,
      start_date: startDate || undefined,
      end_date: isCurrent ? undefined : endDate || undefined,
      is_current: isCurrent,
      description: description || undefined,
    };
    if (entry) {
      update.mutate({ entryId: entry.id, payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      add.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit experience" : "Add experience"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Job title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={endDate} disabled={isCurrent} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={isCurrent} onCheckedChange={(v) => setIsCurrent(Boolean(v))} />
            I currently work here
          </label>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!company.trim() || !title.trim() || isPending} onClick={handleSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkExperienceCard({ userId }: { userId: string }) {
  const { data: entries, isLoading } = useWorkExperience(userId);
  const remove = useRemoveExperience(userId);
  const [dialogEntry, setDialogEntry] = useState<StudentWorkExperienceRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Work experience</h2>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => {
            setDialogEntry(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {isLoading ? null : !entries || entries.length === 0 ? (
        <EmptyState icon={Briefcase} title="No work experience yet" className="border-none py-8" />
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {entry.job_title} · {entry.company_name}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {entry.start_date ? formatDate(entry.start_date) : "—"} –{" "}
                  {entry.is_current ? "Present" : entry.end_date ? formatDate(entry.end_date) : "—"}
                </p>
                {entry.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setDialogEntry(entry);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => remove.mutate(entry.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExperienceEntryDialog userId={userId} entry={dialogEntry} open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
