import { useState } from "react";
import { FilePlus2, Loader2 } from "lucide-react";
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
  onStartApplication,
}: {
  leadId: string;
  leadName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Offered on the success screen — the next thing anyone does after converting. */
  onStartApplication?: () => void;
}) {
  const convertLead = useConvertLead(leadId);
  const [source, setSource] = useState<string>(ConversionSource.AGREEMENT_SIGNED);
  const [remarks, setRemarks] = useState("");
  const [createPortal, setCreatePortal] = useState<"no" | "yes">("no");
  const [result, setResult] = useState<LeadConvertResult | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Converting used to redirect to the applicant page, which is what split one
      // person's file across two sections. The lead page behind this dialog is already
      // re-rendering in client mode, so closing just returns to it.
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
              You can enable portal access for them any time from this page.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
            {onStartApplication && result.student_user_id && (
              <Button onClick={onStartApplication}>
                <FilePlus2 className="h-3.5 w-3.5" /> Start application
              </Button>
            )}
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
            This creates their student record so applications can be started. They stay on this page as a Client.
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
                : "You can enable portal access later from this page."}
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
