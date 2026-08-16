import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Shows a one-time-generated password with copy-to-clipboard — the credential is never shown again after this. */
export function GeneratedPasswordReveal({ password, name }: { password: string; name: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted-foreground">
        Share this password with {name} through a secure channel — it won't be shown again.
      </p>
      <div className="flex items-center gap-2">
        <Input readOnly value={password} className="font-mono" />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
