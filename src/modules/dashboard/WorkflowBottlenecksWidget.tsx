import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Route, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useWorkflowSteps } from "@/modules/application-workflow/hooks";
import { useApplications } from "@/modules/applications/hooks";
import { ApplicationStatus, WorkflowStepStatus } from "@/types/enums";
import { toTitleCase } from "@/utils/format";

export function WorkflowBottlenecksWidget() {
  const { data: currentSteps, isLoading } = useWorkflowSteps({ status: WorkflowStepStatus.CURRENT, limit: 200 });
  const { data: visaApproved } = useApplications({ status: ApplicationStatus.VISA_APPROVED, limit: 1 });
  const { data: visaRejected } = useApplications({ status: ApplicationStatus.VISA_REJECTED, limit: 1 });

  const bottlenecks = useMemo(() => {
    if (!currentSteps) return [];
    const counts = new Map<string, number>();
    for (const step of currentSteps.items) {
      const label = toTitleCase(step.stage_key ?? step.stage_name_snapshot);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [currentSteps]);

  const visaTotal = (visaApproved?.total ?? 0) + (visaRejected?.total ?? 0);
  const visaRate = visaTotal > 0 ? Math.round(((visaApproved?.total ?? 0) / visaTotal) * 100) : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
        <p className="mb-3 text-[13px] font-medium text-foreground">Where applicants are stuck right now</p>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : bottlenecks.length === 0 ? (
          <EmptyState icon={Route} title="No active journeys" description="Start a workflow on an application to see bottlenecks here." className="border-none py-10" />
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottlenecks} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis dataKey="label" type="category" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="var(--info)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Route className="h-3.5 w-3.5" />
            <p className="text-[13px] font-medium">Active journeys</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{currentSteps?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">applications currently mid-journey</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <p className="text-[13px] font-medium">Visa approval rate</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{visaRate === null ? "—" : `${visaRate}%`}</p>
          <p className="text-xs text-muted-foreground">
            {visaTotal === 0 ? "no visa decisions yet" : `${visaApproved?.total ?? 0} approved of ${visaTotal} decided`}
          </p>
        </div>
      </div>
    </div>
  );
}
