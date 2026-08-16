import { useMemo } from "react";
import { GreetingHeader } from "@/modules/dashboard/GreetingHeader";
import { AnalyticsGrid } from "@/modules/dashboard/AnalyticsGrid";
import { ActivityFeed } from "@/modules/dashboard/ActivityFeed";
import { TodaySchedule } from "@/modules/dashboard/TodaySchedule";
import { LeadFunnelWidget } from "@/modules/dashboard/LeadFunnelWidget";
import { LeadSourceChart } from "@/modules/dashboard/LeadSourceChart";
import { PriorityDistributionChart } from "@/modules/dashboard/PriorityDistributionChart";
import { FollowUpReminders } from "@/modules/dashboard/FollowUpReminders";
import { CounsellorLeaderboard } from "@/modules/dashboard/CounsellorLeaderboard";
import { CountryUniversityCharts } from "@/modules/dashboard/CountryUniversityCharts";
import { RecentApplicantsTable } from "@/modules/dashboard/RecentApplicantsTable";
import { TaskBoardPreview } from "@/modules/dashboard/TaskBoardPreview";
import { WorkflowBottlenecksWidget } from "@/modules/dashboard/WorkflowBottlenecksWidget";
import { QuickActions } from "@/modules/dashboard/QuickActions";
import { MyApplicationsWidget, MyAppointmentsWidget, MyDocumentsWidget, MyPaymentsWidget, MyProgressStats } from "@/modules/dashboard/StudentWidgets";
import { RevenueChart } from "@/modules/payments/RevenueChart";
import { useAuthStore } from "@/services/authStore";
import { isManagerRole } from "@/constants/permissions";
import { UserRole } from "@/types/enums";
import { CustomizableDashboard, type DashboardWidget } from "@/components/shared/CustomizableDashboard";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

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
          { id: "recent-applicants", title: "Recent applicants", render: <RecentApplicantsTable />, span: "half" },
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
          { id: "country-university", title: "Country & university interest", render: <CountryUniversityCharts />, span: "full" },
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
          { id: "recent-applicants", title: "Recent applicants", render: <RecentApplicantsTable />, span: "full" },
          { id: "task-board", title: "Task board", render: <TaskBoardPreview />, span: "full" },
          { id: "quick-actions", title: "Quick actions", render: <QuickActions />, span: "full" },
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
      { id: "recent-applicants", title: "Recent applicants", render: <RecentApplicantsTable />, span: "third" },
      { id: "country-university", title: "Country & university interest", render: <CountryUniversityCharts />, span: "full" },
      { id: "workflow-bottlenecks", title: "Workflow bottlenecks", render: <WorkflowBottlenecksWidget />, span: "full" },
      { id: "task-board", title: "Task board", render: <TaskBoardPreview />, span: "full" },
      { id: "quick-actions", title: "Quick actions", render: <QuickActions />, span: "full" },
    ];
    if (isManagerRole(role)) {
      full.splice(7, 0, { id: "leaderboard", title: "Counsellor leaderboard", render: <CounsellorLeaderboard />, span: "third" });
    }
    return { storageKey: "admin", widgets: full };
  }, [role]);

  return (
    <div className="space-y-4">
      <GreetingHeader />
      <CustomizableDashboard widgets={widgets} storageKey={`${storageKey}:${user?.id ?? "anon"}`} />
    </div>
  );
}
