import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, UserCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/modules/leads/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, initials } from "@/utils/format";

/**
 * Was "Recent applicants", listing `User(role=student)` — which meant every row
 * linked to a page that no longer exists, and a student user carries no lead id to
 * link back with. It lists converted leads instead: same people, and each row opens
 * the file the counsellor actually works.
 */
export function RecentClientsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const { data, isLoading } = useLeads({ status: "converted", search: debounced || undefined, limit: 8 });

  const items = data?.items ?? [];

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Recent clients</h2>
        <div className="relative w-48">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="h-7 pl-7 text-xs" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={UserCheck} title="No clients yet" className="border-none py-8" />
      ) : (
        <div className="divide-y divide-border">
          {items.map((lead) => (
            <button
              key={lead.id}
              onClick={() => navigate(`/leads/${lead.id}`)}
              className="flex w-full items-center gap-2.5 py-2 text-left transition-colors hover:bg-muted/30"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                  {initials(lead.first_name, lead.last_name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {lead.first_name} {lead.last_name ?? ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{lead.email ?? lead.phone}</p>
              </div>
              {lead.converted_at && (
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(lead.converted_at)}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
