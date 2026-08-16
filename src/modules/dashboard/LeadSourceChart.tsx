import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/modules/leads/hooks";
import { toTitleCase } from "@/utils/format";

export function LeadSourceChart() {
  const { data, isLoading } = useLeads({ limit: 200 });

  const bySource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of data?.items ?? []) {
      counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label: toTitleCase(label), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-[13px] font-medium text-foreground">Lead sources</p>
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : bySource.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No leads yet</div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySource} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis dataKey="label" type="category" width={90} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
