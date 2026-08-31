import { useState } from "react";
import { Globe2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountries, useCreateCountry, useDeleteCountry } from "@/modules/academic/hooks";

/**
 * The destinations the consultancy places applicants in.
 *
 * All that is left of the old Academic data screen. Its other three tabs —
 * universities, courses and intakes — were a second, thinner view of rows this
 * section already owns properly: universities and courses now have their own
 * lists and their own record pages a few items up this nav group, and keeping
 * a parallel add-a-row form beside them only invited the two to disagree.
 *
 * Countries stayed because nothing else edits them, and because they are the
 * one piece of that screen that is not a duplicate: a country is what a
 * university hangs off, and the picker on the university form reads this list.
 *
 * Deleting one cascades all the way down, so it confirms first — that was true
 * on the old screen and is the part of it worth keeping.
 */
function confirmDelete(kind: string, name: string, consequence?: string): boolean {
  return window.confirm(
    `Delete ${kind} \u201c${name}\u201d?` + (consequence ? `\n\n${consequence}` : "") + "\n\nThis cannot be undone.",
  );
}

export function WebsiteCountriesPage() {
  const { data, isLoading } = useCountries({ limit: 100 });
  const createCountry = useCreateCountry();
  const deleteCountry = useDeleteCountry();
  const [name, setName] = useState("");
  const [iso2, setIso2] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Countries"
        description="The destinations you place applicants in. Universities hang off these, and the picker on a university record reads this list."
      />

      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Country name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Australia" />
        </div>
        <div className="w-24 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">ISO2</label>
          <Input value={iso2} onChange={(e) => setIso2(e.target.value.toUpperCase())} placeholder="AU" maxLength={2} />
        </div>
        <Button
          disabled={!name || iso2.length !== 2 || createCountry.isPending}
          onClick={() => createCountry.mutate({ name, iso2 }, { onSuccess: () => { setName(""); setIso2(""); } })}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Globe2} title="No countries yet" description="Add the destinations your consultancy places applicants in." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {data.items.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <Badge variant="secondary">{c.iso2}</Badge>
                {!c.is_active && <Badge variant="outline">Inactive</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => confirmDelete("country", c.name, "Its universities and every course under them go too.") && deleteCountry.mutate(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
