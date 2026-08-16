import { useEffect, useState } from "react";
import { GraduationCap, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useAddEducation,
  useEducationHistory,
  useRemoveEducation,
  useUpdateEducation,
} from "@/modules/users/hooks";
import type { StudentEducationHistoryRead } from "@/modules/users/types";
import { DegreeLevel } from "@/types/enums";
import { formatDate, toTitleCase } from "@/utils/format";

function EducationEntryDialog({
  userId,
  entry,
  open,
  onOpenChange,
}: {
  userId: string;
  entry: StudentEducationHistoryRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAddEducation(userId);
  const update = useUpdateEducation(userId);
  const [institution, setInstitution] = useState("");
  const [degreeLevel, setDegreeLevel] = useState<string>(DegreeLevel.BACHELOR);
  const [field, setField] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [grade, setGrade] = useState("");

  useEffect(() => {
    if (open) {
      setInstitution(entry?.institution_name ?? "");
      setDegreeLevel(entry?.degree_level ?? DegreeLevel.BACHELOR);
      setField(entry?.field_of_study ?? "");
      setStartDate(entry?.start_date ?? "");
      setEndDate(entry?.end_date ?? "");
      setGrade(entry?.grade ?? "");
    }
  }, [open, entry]);

  const isPending = add.isPending || update.isPending;

  function handleSubmit() {
    const payload = {
      institution_name: institution,
      degree_level: degreeLevel as DegreeLevel,
      field_of_study: field || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      grade: grade || undefined,
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
          <DialogTitle>{entry ? "Edit education" : "Add education"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Institution</Label>
            <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Kathmandu University" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Degree level</Label>
              <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DegreeLevel).map((d) => (
                    <SelectItem key={d} value={d}>
                      {toTitleCase(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Field of study</Label>
              <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="Computer Science" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Grade / GPA</Label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="3.7 GPA" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!institution.trim() || isPending} onClick={handleSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EducationHistoryCard({ userId }: { userId: string }) {
  const { data: entries, isLoading } = useEducationHistory(userId);
  const remove = useRemoveEducation(userId);
  const [dialogEntry, setDialogEntry] = useState<StudentEducationHistoryRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Education history</h2>
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
        <EmptyState icon={GraduationCap} title="No education history yet" className="border-none py-8" />
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{entry.institution_name}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.degree_level && `${toTitleCase(entry.degree_level)} · `}
                  {entry.field_of_study}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {entry.start_date ? formatDate(entry.start_date) : "—"} – {entry.end_date ? formatDate(entry.end_date) : "Present"}
                  {entry.grade && ` · ${entry.grade}`}
                </p>
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

      <EducationEntryDialog userId={userId} entry={dialogEntry} open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
