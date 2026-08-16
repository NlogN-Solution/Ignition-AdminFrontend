import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/modules/leads/hooks";
import { useCountries, useUniversities } from "@/modules/academic/hooks";

function ChartShell({ title, isLoading, data, dataKey = "count" }: { title: string; isLoading: boolean; data: { label: string; count: number }[]; dataKey?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-[13px] font-medium text-foreground">{title}</p>
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No data yet</div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis dataKey="label" type="category" width={90} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey={dataKey} fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function CountryUniversityCharts() {
  const { data: leads, isLoading: leadsLoading } = useLeads({ limit: 100 });
  const { data: universities, isLoading: uniLoading } = useUniversities({ limit: 100 });
  const { data: countries, isLoading: countriesLoading } = useCountries({ limit: 100 });

  const countryDemand = useMemo(() => {
    if (!leads) return [];
    const counts = new Map<string, number>();
    for (const lead of leads.items) {
      if (!lead.interested_country) continue;
      counts.set(lead.interested_country, (counts.get(lead.interested_country) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [leads]);

  const universitiesByCountry = useMemo(() => {
    if (!universities || !countries) return [];
    const countryNameById = new Map(countries.items.map((c) => [c.id, c.name]));
    const counts = new Map<string, number>();
    for (const uni of universities.items) {
      const name = countryNameById.get(uni.country_id) ?? "Unknown";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [universities, countries]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartShell title="Lead demand by destination" isLoading={leadsLoading} data={countryDemand} />
      <ChartShell title="Partner universities by country" isLoading={uniLoading || countriesLoading} data={universitiesByCountry} />
    </div>
  );
}
