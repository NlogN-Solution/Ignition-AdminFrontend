import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/modules/users/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { UserRole } from "@/types/enums";
import { initials } from "@/utils/format";

export function RecentApplicantsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const { data, isLoading } = useUsers({ role: UserRole.STUDENT, search: debounced || undefined, limit: 8 });

  const items = useMemo(() => [...(data?.items ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [data]);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Recent applicants</h2>
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
        <EmptyState icon={GraduationCap} title="No applicants found" className="border-none py-8" />
      ) : (
        <div className="divide-y divide-border">
          {items.map((u) => (
            <button key={u.id} onClick={() => navigate(`/applicants/${u.id}`)} className="flex w-full items-center gap-2.5 py-2 text-left transition-colors hover:bg-muted/30">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">{initials(u.first_name, u.last_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {u.first_name} {u.last_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <StatusBadge status={u.status} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
