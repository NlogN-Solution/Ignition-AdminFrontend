import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneratedPasswordReveal } from "@/modules/users/GeneratedPasswordReveal";
import { ConversionSource } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useConvertLead } from "./hooks";
import type { LeadConvertResult } from "./types";

export function ConvertLeadDialog({
  leadId,
  leadName,
  open,
  onOpenChange,
}: {
  leadId: string;
  leadName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const convertLead = useConvertLead(leadId);
  const [source, setSource] = useState<string>(ConversionSource.AGREEMENT_SIGNED);
  const [remarks, setRemarks] = useState("");
  const [createPortal, setCreatePortal] = useState<"no" | "yes">("no");
  const [result, setResult] = useState<LeadConvertResult | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Closing after a successful conversion (with or without a shown credential) still
      // means the lead is gone — send the user to the new applicant record either way.
      if (result?.student_user_id) navigate(`/applicants/${result.student_user_id}`);
      setResult(null);
      setSource(ConversionSource.AGREEMENT_SIGNED);
      setRemarks("");
      setCreatePortal("no");
    }
    onOpenChange(next);
  }

  if (result) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Converted to client</DialogTitle>
            <DialogDescription>
              {result.portal_account_created ? "Their student portal account is ready." : "No portal account was created."}
            </DialogDescription>
          </DialogHeader>

          {result.generated_password ? (
            <GeneratedPasswordReveal password={result.generated_password} name={leadName} />
          ) : (
            <p className="text-[13px] text-muted-foreground">
              You can enable portal access for them any time from their applicant page.
            </p>
          )}

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Convert to client</DialogTitle>
          <DialogDescription>
            This creates a Student record and moves the applicant into the Student module — the lead will no longer appear in Lead
            Management.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>How did they convert?</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ConversionSource).map((s) => (
                  <SelectItem key={s} value={s}>
                    {toTitleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Create student portal account?</Label>
            <Select value={createPortal} onValueChange={(v) => setCreatePortal(v as "no" | "yes")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No — just create the student record</SelectItem>
                <SelectItem value="yes">Yes — generate login credentials now</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {createPortal === "yes"
                ? "You'll get a one-time password to share with them."
                : "You can enable portal access later from their applicant page."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={convertLead.isPending}
            onClick={() =>
              convertLead.mutate(
                {
                  conversion_source: source as ConversionSource,
                  remarks: remarks || undefined,
                  create_portal_account: createPortal === "yes",
                },
                { onSuccess: setResult },
              )
            }
          >
            {convertLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
