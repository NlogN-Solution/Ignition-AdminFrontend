import {
  GraduationCap,
  UserPlus,
  ShieldCheck,
  Flame,
  UserX,
  TrendingUp,
  FileText,
  Award,
  Plane,
  Wallet,
  CheckSquare,
  CalendarDays,
  Building2,
  Globe2,
  BookOpen,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useDashboardCounts } from "./hooks";
import { syntheticSeries } from "./service";
import { formatCurrency } from "@/utils/format";

export function AnalyticsGrid() {
  const counts = useDashboardCounts();

  const cards = [
    { key: "raw-leads", label: "Raw Leads", value: counts.rawLeads, icon: UserPlus, href: "/leads?tab=raw", accent: "info" as const },
    { key: "prospects", label: "Prospects", value: counts.prospects, icon: ShieldCheck, href: "/leads?tab=prospect", accent: "primary" as const },
    { key: "hot-leads", label: "Hot Leads", value: counts.hotLeads, icon: Flame, href: "/leads?priority=hot", accent: "danger" as const },
    { key: "lost-leads", label: "Lost Leads", value: counts.lostLeads, icon: UserX, href: "/leads?tab=lost", accent: "danger" as const },
    {
      key: "conversion-rate",
      label: "Conversion rate",
      value: counts.conversionRate,
      icon: TrendingUp,
      href: "/leads",
      accent: "success" as const,
      format: (v: number) => `${Math.round(v)}%`,
    },
    { key: "applicants", label: "Applicants", value: counts.applicants, icon: GraduationCap, href: "/applicants", accent: "primary" as const },
    { key: "applications", label: "Applications", value: counts.applications, icon: FileText, href: "/applications", accent: "primary" as const },
    { key: "offers", label: "Offers received", value: counts.offers, icon: Award, href: "/applications", accent: "success" as const },
    { key: "visa", label: "Visa in process", value: counts.visaProcessing, icon: Plane, href: "/applications", accent: "warning" as const },
    {
      key: "revenue",
      label: "Revenue collected",
      value: counts.revenue,
      icon: Wallet,
      href: "/payments",
      accent: "success" as const,
      format: (v: number) => formatCurrency(v),
    },
    { key: "tasks", label: "Open tasks", value: counts.openTasks, icon: CheckSquare, href: "/tasks", accent: "warning" as const },
    { key: "appointments", label: "Appointments", value: counts.appointments, icon: CalendarDays, href: "/appointments", accent: "info" as const },
    { key: "universities", label: "Universities", value: counts.universities, icon: Building2, href: "/academic/universities", accent: "primary" as const },
    { key: "countries", label: "Countries", value: counts.countries, icon: Globe2, href: "/academic/countries", accent: "info" as const },
    { key: "courses", label: "Courses", value: counts.courses, icon: BookOpen, href: "/academic/programs", accent: "primary" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
