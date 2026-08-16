import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPicker } from "@/components/shared/UserPicker";
import { UniversityPicker, ProgramPicker, IntakePicker } from "@/modules/academic/pickers";
import { UserRole } from "@/types/enums";
import { useCreateApplication } from "./hooks";

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStudentId?: string;
}

export function ApplicationFormDialog({ open, onOpenChange, defaultStudentId }: ApplicationFormDialogProps) {
  const createApplication = useCreateApplication();
  const [studentId, setStudentId] = useState<string | undefined>(defaultStudentId);
  const [counsellorId, setCounsellorId] = useState<string | undefined>();
  const [universityId, setUniversityId] = useState<string | undefined>();
  const [programId, setProgramId] = useState<string | undefined>();
  const [intakeId, setIntakeId] = useState<string | undefined>();
  const [tuitionFee, setTuitionFee] = useState("");
  const [scholarship, setScholarship] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      setStudentId(defaultStudentId);
      setCounsellorId(undefined);
      setUniversityId(undefined);
      setProgramId(undefined);
      setIntakeId(undefined);
      setTuitionFee("");
      setScholarship("");
      setRemarks("");
    }
  }, [open, defaultStudentId]);

  const canSubmit = Boolean(studentId && programId);

  function handleSubmit() {
    if (!studentId || !programId) return;
    createApplication.mutate(
      {
        student_id: studentId,
        program_id: programId,
        counsellor_id: counsellorId,
        intake_id: intakeId,
        tuition_fee: tuitionFee ? Number(tuitionFee) : undefined,
        scholarship_amount: scholarship ? Number(scholarship) : undefined,
        remarks: remarks || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Applicant</Label>
            <UserPicker value={studentId} onChange={setStudentId} role={UserRole.STUDENT} placeholder="Select applicant…" disabled={Boolean(defaultStudentId)} />
          </div>

          <div className="space-y-1.5">
            <Label>University</Label>
            <UniversityPicker
              value={universityId}
              onChange={(id) => {
                setUniversityId(id);
                setProgramId(undefined);
                setIntakeId(undefined);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Course</Label>
              <ProgramPicker
                value={programId}
                onChange={(id) => {
                  setProgramId(id);
                  setIntakeId(undefined);
                }}
                universityId={universityId}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Intake</Label>
              <IntakePicker value={intakeId} onChange={setIntakeId} programId={programId} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Counsellor (optional)</Label>
            <UserPicker value={counsellorId} onChange={setCounsellorId} role={UserRole.COUNSELLOR} placeholder="Assign a counsellor…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tuition fee</Label>
              <Input type="number" value={tuitionFee} onChange={(e) => setTuitionFee(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Scholarship</Label>
              <Input type="number" value={scholarship} onChange={(e) => setScholarship(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || createApplication.isPending} onClick={handleSubmit}>
            {createApplication.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
