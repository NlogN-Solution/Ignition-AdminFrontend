import {
  UserPlus,
  Users,
  TrendingUp,
  FileText,
  Award,
  Plane,
  GraduationCap,
  CheckSquare,
  CalendarDays,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useDashboardCounts } from "./hooks";
import { syntheticSeries } from "./service";

/**
 * The numbers Ignition is actually run on.
 *
 * This was fifteen tiles. Seven of them have gone, for two different reasons:
 *
 *   - **Prospects, Hot leads, Lost leads** encoded the old four-tab pipeline as
 *     three separate headline numbers. There is one lead list now and one
 *     lifecycle on each row (see `pages/leads/LeadsPage`), so slicing the same
 *     set three ways at the top of the dashboard says less than the list does,
 *     and said it in a vocabulary the list no longer uses.
 *   - **Universities, Countries, Courses** counted catalogue rows. That is
 *     inventory, not activity: the number only changes when someone runs an
 *     import, so a tile that tracks it is a tile that never moves. The
 *     catalogue has its own section, which is where you go when you care.
 *   - **Revenue collected** is a finance figure with a finance screen behind it.
 *     It stays on the Finance dashboard, where the person who acts on it works,
 *     rather than heading the console for a counsellor who cannot act on it.
 *
 * What is left is one row that reads as a journey, left to right, in the same
 * order as the lifecycle rails below it: who arrived, who is being worked, what
 * is in flight, what landed — plus the two operational counts (tasks,
 * appointments) that say what to do today.
 */
export function AnalyticsGrid() {
  const counts = useDashboardCounts();

  const cards = [
    { key: "raw-leads", label: "New & in progress", value: counts.rawLeads, icon: UserPlus, href: "/leads?stage=new,contacted,follow_up", accent: "info" as const },
    { key: "leads", label: "Total leads", value: counts.leads, icon: Users, href: "/leads", accent: "primary" as const },
    {
      key: "conversion-rate",
      label: "Conversion rate",
      value: counts.conversionRate,
      icon: TrendingUp,
      href: "/leads",
      accent: "success" as const,
      format: (v: number) => `${Math.round(v)}%`,
    },
    { key: "clients", label: "Clients", value: counts.clients, icon: GraduationCap, href: "/leads?stage=converted", accent: "primary" as const },
    { key: "applications", label: "Applications", value: counts.applications, icon: FileText, href: "/applications", accent: "primary" as const },
    { key: "offers", label: "Offers received", value: counts.offers, icon: Award, href: "/applications?", accent: "success" as const },
    { key: "visa", label: "Visa in process", value: counts.visaProcessing, icon: Plane, href: "/applications", accent: "warning" as const },
    { key: "tasks", label: "Open tasks", value: counts.openTasks, icon: CheckSquare, href: "/tasks", accent: "warning" as const },
    { key: "appointments", label: "Appointments", value: counts.appointments, icon: CalendarDays, href: "/appointments", accent: "info" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const { sparkline, trend } = syntheticSeries(card.key, card.value);
        return (
          <StatCard
            key={card.key}
            label={card.label}
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
