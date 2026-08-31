import { useEffect, useMemo, useState } from "react";
import { Columns3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  useCreateUniversityRoute,
  useDeleteUniversityRoute,
  useUniversityRoutes,
  useUpdateUniversityRoute,
} from "./hooks";
import { ENTRY_ROUTES, ENTRY_ROUTE_LABELS, type EntryRoute, type UniversityRouteRead } from "./types";

/**
 * The entry-criteria matrix, rendered the way the source spreadsheet renders
 * it: criteria labels down the side, entry routes across the top.
 *
 * That shape is the point. Staff recognise this screen instantly because it is
 * the file they already work in — a form-per-route would be the same data in
 * an arrangement nobody has ever seen.
 */

const ROWS = [
  { key: "academic_criteria", label: "Academic criteria" },
  { key: "english_criteria", label: "English language criteria" },
  { key: "english_waiver", label: "English waiver criteria" },
  { key: "fee_structure", label: "Fee structure" },
  { key: "scholarship_text", label: "Scholarship" },
  { key: "gap_policy", label: "Gap" },
  { key: "cas_deposit", label: "CAS deposit" },
  { key: "enrolment_fee", label: "Enrolment fee" },
  { key: "deadlines", label: "Deadlines" },
  { key: "previous_refusal", label: "Previous refusal case" },
] as const;

type RowKey = (typeof ROWS)[number]["key"];

type Draft = Record<string, Partial<Record<RowKey | "label" | "is_published", string | boolean>>>;

export function RequirementsMatrix({ universityId }: { universityId: string }) {
  const { data, isLoading } = useUniversityRoutes(universityId);
  const create = useCreateUniversityRoute(universityId);
  const update = useUpdateUniversityRoute(universityId);
  const remove = useDeleteUniversityRoute(universityId);

  const routes = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => a.display_order - b.display_order),
    [data],
  );

  const [draft, setDraft] = useState<Draft>({});
  const [adding, setAdding] = useState<EntryRoute | "">("");

  // A fresh fetch replaces anything not yet saved; keeping stale edits around
  // after a refetch would silently overwrite someone else's change on save.
  useEffect(() => setDraft({}), [data]);

  const dirty = Object.keys(draft).length > 0;

  function edit(routeId: string, key: RowKey | "label" | "is_published", value: string | boolean) {
    setDraft((current) => ({ ...current, [routeId]: { ...current[routeId], [key]: value } }));
  }

  function cellValue(route: UniversityRouteRead, key: RowKey) {
    const pending = draft[route.id]?.[key];
    return (pending as string | undefined) ?? route[key] ?? "";
  }

  async function saveAll() {
    for (const [routeId, changes] of Object.entries(draft)) {
      await update.mutateAsync({ id: routeId, payload: changes as never });
    }
    setDraft({});
  }

  const unusedRoutes = ENTRY_ROUTES.filter((key) => !routes.some((route) => route.route_key === key));

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Labels down, routes across — the same shape as the intake workbook. Each cell is the prose the
          public site shows for that route.
        </p>
        <div className="flex items-center gap-2">
          {unusedRoutes.length > 0 && (
            <>
              <Select value={adding || undefined} onValueChange={(value) => setAdding(value as EntryRoute)}>
                <SelectTrigger className="h-8 w-52"><SelectValue placeholder="Add a route…" /></SelectTrigger>
                <SelectContent>
                  {unusedRoutes.map((key) => (
                    <SelectItem key={key} value={key}>{ENTRY_ROUTE_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                disabled={!adding || create.isPending}
                onClick={() => {
                  if (!adding) return;
                  create.mutate(
                    {
                      university_id: universityId,
                      route_key: adding,
                      label: ENTRY_ROUTE_LABELS[adding],
                      display_order: routes.length,
                    },
                    { onSuccess: () => setAdding("") },
                  );
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add column
              </Button>
            </>
          )}
          <Button size="sm" disabled={!dirty || update.isPending} onClick={saveAll}>
            {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save changes
          </Button>
        </div>
      </div>

      {routes.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="No entry routes yet"
          description="Add a column for each route this university admits through — undergraduate, postgraduate, pathway, and so on."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="sticky left-0 z-10 w-44 border-b border-r border-border bg-muted/40 p-2 text-left text-xs font-medium">
                  Criteria
                </th>
                {routes.map((route) => (
                  <th key={route.id} className="min-w-64 border-b border-border p-2 text-left align-top">
                    <div className="space-y-1.5">
                      <Input
                        className="h-7 text-xs font-medium"
                        value={(draft[route.id]?.label as string | undefined) ?? route.label ?? ""}
                        onChange={(event) => edit(route.id, "label", event.target.value)}
                        placeholder={ENTRY_ROUTE_LABELS[route.route_key]}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{route.route_key}</span>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            className="scale-75"
                            checked={(draft[route.id]?.is_published as boolean | undefined) ?? route.is_published}
                            onCheckedChange={(checked) => edit(route.id, "is_published", checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              if (!window.confirm(`Remove the ${route.label ?? route.route_key} column and its criteria?`)) return;
                              remove.mutate(route.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="align-top">
                  <th className="sticky left-0 z-10 border-b border-r border-border bg-card p-2 text-left text-xs font-medium text-muted-foreground">
                    {row.label}
                  </th>
                  {routes.map((route) => (
                    <td key={route.id} className="border-b border-border p-1">
                      <Textarea
                        rows={3}
                        className="min-h-16 resize-y border-0 text-xs shadow-none focus-visible:ring-1"
                        value={cellValue(route, row.key)}
                        onChange={(event) => edit(route.id, row.key, event.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExtrasPanel routes={routes} />
    </div>
  );
}

/**
 * Criteria labels the importer did not recognise.
 *
 * The workbook uses eleven known labels plus a long tail of one-offs
 * ("Pathway programme", "London campus"). They are stored rather than dropped,
 * and shown here so a human can decide whether one deserves promoting to a
 * real row — nothing in the source file goes missing silently.
 */
function ExtrasPanel({ routes }: { routes: UniversityRouteRead[] }) {
  const withExtras = routes.filter((route) => route.extras && Object.keys(route.extras).length > 0);
  if (withExtras.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <Label className="text-xs">Unrecognised labels from the workbook</Label>
      <p className="text-xs text-muted-foreground">
        Kept verbatim rather than discarded. Move anything important into a row above.
      </p>
      {withExtras.map((route) => (
        <div key={route.id} className="space-y-1">
          <p className="text-xs font-medium">{route.label ?? route.route_key}</p>
          {Object.entries(route.extras ?? {}).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[160px_1fr] gap-2 text-xs">
              <span className="text-muted-foreground">{key}</span>
              <span className="whitespace-pre-wrap">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
