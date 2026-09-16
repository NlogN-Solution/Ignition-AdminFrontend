import { Award, BarChart3, FileText, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useDashboardCounts } from "./hooks";
import { syntheticSeries } from "./service";

/**
 * The four numbers the business is judged on, given their own row.
 *
 * `AnalyticsGrid` still exists and still holds the operational counts — who is
 * being worked, what is in flight, what to do today. These four were taken out
 * of it and promoted because they are a different kind of number: they are the
 * funnel, left to right, and a manager opening the console is reading them
 * before anything else. Nine tiles of equal weight made that impossible; the
 * conversion rate sat third from the left between two lead counts.
 *
 * **They are not printed twice.** `AnalyticsGrid` no longer renders these four
 * — see the note there. Everything that was on the dashboard is still on the
 * dashboard; four of them moved up a row.
 *
 * The sparkline and the percentage on each tile are `syntheticSeries`, which
 * is deterministic decoration around the real total, because no history
 * endpoint exists to derive a seven-point series from. That has been true of
 * every stat tile in this console since it was built and is documented at the
 * function. The two cards above this row do *not* use it — their deltas are
 * counted from real timestamps — because a fabricated trend under a 42px
 * number is a different order of claim.
 */
export function HeadlineStats() {
  const counts = useDashboardCounts();

  const cards = [
    {
      key: "leads",
      label: "Students in pipeline",
      hint: "Total leads",
      value: counts.leads,
      icon: Users,
      href: "/leads",
      accent: "info" as const,
    },
    {
      key: "applications",
      label: "Applications",
      hint: "Total submissions",
      value: counts.applications,
      icon: FileText,
      href: "/applications",
      accent: "primary" as const,
    },
    {
      key: "offers",
      label: "Offers received",
      hint: "Offers received",
      value: counts.offers,
      icon: Award,
      href: `/applications?status=offer_received`,
      accent: "success" as const,
    },
    {
      key: "conversion-rate",
      label: "Conversion rate",
      hint: "Converted vs lost leads",
      value: counts.conversionRate,
      icon: BarChart3,
      href: "/leads",
      accent: "success" as const,
      format: (v: number) => `${Math.round(v)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {cards.map((card) => {
        const { sparkline, trend } = syntheticSeries(card.key, card.value);
        return (
          <StatCard
            key={card.key}
            label={card.label}
            hint={card.hint}
            value={card.value}
            icon={card.icon}
            href={card.href}
            accent={card.accent}
            sparkline={sparkline}
            trend={trend}
            format={card.format}
          />
        );
      })}
    </div>
  );
}
