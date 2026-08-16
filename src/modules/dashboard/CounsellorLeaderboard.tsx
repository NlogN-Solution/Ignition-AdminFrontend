import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { userService } from "@/modules/users/service";
import { leadService } from "@/modules/leads/service";
import { UserRole } from "@/types/enums";
import { initials } from "@/utils/format";

export function CounsellorLeaderboard() {
  const { data: counsellors, isLoading: counsellorsLoading } = useQuery({
    queryKey: ["dashboard", "counsellors"],
    queryFn: () => userService.list({ role: UserRole.COUNSELLOR, limit: 20 }),
  });

  const results = useQueries({
    queries: (counsellors?.items ?? []).map((c) => ({
      queryKey: ["dashboard", "counsellor-conversions", c.id],
      queryFn: () => leadService.list({ assigned_to: c.id, status: "converted", limit: 1 }),
      enabled: Boolean(counsellors),
    })),
  });

  const leaderboard = useMemo(() => {
    if (!counsellors) return [];
    return counsellors.items
      .map((c, i) => ({ counsellor: c, converted: results[i]?.data?.total ?? 0 }))
      .sort((a, b) => b.converted - a.converted)
      .slice(0, 6);
  }, [counsellors, results]);

  const isLoading = counsellorsLoading || results.some((r) => r.isLoading);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-[13px] font-medium text-foreground">Counsellor leaderboard</p>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <EmptyState icon={Trophy} title="No counsellors yet" className="border-none py-8" />
      ) : (
        <div className="space-y-1">
          {leaderboard.map((entry, idx) => (
            <div key={entry.counsellor.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
              <span className="w-4 shrink-0 text-center text-xs font-medium tabular-nums text-muted-foreground">{idx + 1}</span>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                  {initials(entry.counsellor.first_name, entry.counsellor.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                {entry.counsellor.first_name} {entry.counsellor.last_name}
              </span>
              <span className="text-xs font-medium tabular-nums text-success">{entry.converted} converted</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
