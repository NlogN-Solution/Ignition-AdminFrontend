import { useMemo } from "react";
import { GreetingHeader } from "@/modules/dashboard/GreetingHeader";
import { NewRegistrationsCard } from "@/modules/dashboard/NewRegistrationsCard";
import { NewApplicationRequestsCard } from "@/modules/dashboard/NewApplicationRequestsCard";
import { AnalyticsGrid } from "@/modules/dashboard/AnalyticsGrid";
import { ActivityFeed } from "@/modules/dashboard/ActivityFeed";
import { TodaySchedule } from "@/modules/dashboard/TodaySchedule";
import { LeadFunnelWidget } from "@/modules/dashboard/LeadFunnelWidget";
import { LeadSourceChart } from "@/modules/dashboard/LeadSourceChart";
import { PriorityDistributionChart } from "@/modules/dashboard/PriorityDistributionChart";
import { FollowUpReminders } from "@/modules/dashboard/FollowUpReminders";
import { CounsellorLeaderboard } from "@/modules/dashboard/CounsellorLeaderboard";
import { RecentClientsTable } from "@/modules/dashboard/RecentClientsTable";
import { WorkflowBottlenecksWidget } from "@/modules/dashboard/WorkflowBottlenecksWidget";
import { HeadlineStats } from "@/modules/dashboard/HeadlineStats";
import { QuickActionsBar } from "@/modules/dashboard/QuickActionsBar";
import { MyApplicationsWidget, MyAppointmentsWidget, MyDocumentsWidget, MyPaymentsWidget, MyProgressStats } from "@/modules/dashboard/StudentWidgets";
import { RevenueChart } from "@/modules/payments/RevenueChart";
import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { UserRole } from "@/types/enums";
import { CustomizableDashboard, type DashboardWidget } from "@/components/shared/CustomizableDashboard";

/**
 * ## The fixed top, and the customisable rest
 *
 * The dashboard used to be one list of draggable widgets from the greeting
 * down. That is right for the reporting half — different desks care about
 * different charts, and they can order and hide them — and wrong for the part
 * that answers "is anything waiting on us", which was `alwaysFirst` on one
 * widget and a convention on the next.
 *
 * So the page is now two things. A **fixed masthead**: the two arrival cards
 * side by side, then the four funnel numbers. Nobody can drag the question
 * "has a student been waiting three days" below a pie chart. And **the
 * customisable remainder** underneath, unchanged, still draggable, still
 * hideable, still per-user — everything that was on this page is still on it.
 *
 * Underneath that, a quick-action bar pinned to the bottom of the viewport.
 *
 * ## Who sees what
 *
 * Deliberately the same visibility each piece had as a widget. Marketing saw
 * registrations and not the review queue; finance saw neither. Promoting a
 * widget out of the list is a layout change, and it should not quietly widen
 * who can see the applications a counsellor has not picked up.
 */
export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const isStudent = role === UserRole.STUDENT;
  const isFinance = role === UserRole.FINANCE;
  const isMarketing = role === UserRole.MARKETING;
  // Finance and students get neither card; marketing gets registrations only.
  const showRegistrations = !isStudent && !isFinance;
  const showRequests = !isStudent && !isFinance && !isMarketing;
  const showHeadline = !isStudent;
  const showQuickActions = !isStudent && !isFinance && !isMarketing;

  const { widgets, storageKey } = useMemo(() => {
    if (role === UserRole.STUDENT) {
      return {
        storageKey: "student",
        widgets: [
          { id: "my-progress", title: "My progress", render: <MyProgressStats />, span: "full" },
          { id: "my-applications", title: "My applications", render: <MyApplicationsWidget />, span: "third" },
          { id: "my-documents", title: "My documents", render: <MyDocumentsWidget />, span: "third" },
          { id: "my-appointments", title: "My appointments", render: <MyAppointmentsWidget />, span: "third" },
          { id: "my-payments", title: "My payments", render: <MyPaymentsWidget />, span: "third" },
        ] satisfies DashboardWidget[],
      };
    }

    if (role === UserRole.FINANCE) {
      return {
        storageKey: "finance",
        widgets: [
          { id: "analytics", title: "Overview", render: <AnalyticsGrid />, span: "full" },
          { id: "revenue", title: "Revenue", render: <RevenueChart />, span: "full" },
          { id: "recent-clients", title: "Recent clients", render: <RecentClientsTable />, span: "half" },
          { id: "follow-ups", title: "Follow-up reminders", render: <FollowUpReminders />, span: "half" },
        ] satisfies DashboardWidget[],
      };
    }

    if (role === UserRole.MARKETING) {
      return {
        storageKey: "marketing",
        widgets: [
          { id: "analytics", title: "Overview", render: <AnalyticsGrid />, span: "full" },
          { id: "lead-funnel", title: "Lead funnel", render: <LeadFunnelWidget />, span: "third" },
          { id: "lead-source", title: "Lead source", render: <LeadSourceChart />, span: "third" },
          { id: "priority", title: "Priority distribution", render: <PriorityDistributionChart />, span: "third" },
        ] satisfies DashboardWidget[],
      };
    }

    if (role === UserRole.COUNSELLOR) {
      return {
        storageKey: "counsellor",
        widgets: [
          { id: "analytics", title: "Overview", render: <AnalyticsGrid />, span: "full" },
          { id: "schedule", title: "Today's schedule", render: <TodaySchedule />, span: "third" },
          { id: "lead-funnel", title: "Lead funnel", render: <LeadFunnelWidget />, span: "third" },
          { id: "follow-ups", title: "Follow-up reminders", render: <FollowUpReminders />, span: "third" },
          { id: "recent-clients", title: "Recent clients", render: <RecentClientsTable />, span: "full" },
        ] satisfies DashboardWidget[],
      };
    }

    // Super Admin, Admin, Manager, Support, Admissions — the full operational dashboard.
    const full: DashboardWidget[] = [
      { id: "analytics", title: "Overview", render: <AnalyticsGrid />, span: "full" },
      { id: "activity", title: "Activity feed", render: <ActivityFeed />, span: "half" },
      { id: "schedule", title: "Today's schedule", render: <TodaySchedule />, span: "third" },
      { id: "lead-funnel", title: "Lead funnel", render: <LeadFunnelWidget />, span: "third" },
      { id: "lead-source", title: "Lead source", render: <LeadSourceChart />, span: "third" },
      { id: "priority", title: "Priority distribution", render: <PriorityDistributionChart />, span: "third" },
      { id: "follow-ups", title: "Follow-up reminders", render: <FollowUpReminders />, span: "third" },
      { id: "recent-clients", title: "Recent clients", render: <RecentClientsTable />, span: "third" },
      { id: "workflow-bottlenecks", title: "Workflow bottlenecks", render: <WorkflowBottlenecksWidget />, span: "full" },
    ];
    if (isManagerRole(role)) {
      full.splice(8, 0, { id: "leaderboard", title: "Counsellor leaderboard", render: <CounsellorLeaderboard />, span: "third" });
    }
    return { storageKey: "admin", widgets: full };
  }, [role]);

  return (
    <div className="space-y-4">
      <GreetingHeader />

      {(showRegistrations || showRequests) && (
        // Two tracks only when there are two cards. One card stretched across
        // the page would put a 42px number next to half a screen of nothing.
        <div className={showRegistrations && showRequests ? "grid gap-4 xl:grid-cols-2" : ""}>
          {showRegistrations && <NewRegistrationsCard />}
          {showRequests && <NewApplicationRequestsCard />}
        </div>
      )}

      {showHeadline && <HeadlineStats />}

      <CustomizableDashboard widgets={widgets} storageKey={`${storageKey}:${user?.id ?? "anon"}`} />

      {showQuickActions && <QuickActionsBar />}
    </div>
  );
}
