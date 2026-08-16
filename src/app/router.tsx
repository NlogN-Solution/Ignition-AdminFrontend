import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppShell } from "@/layouts/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { RequireModule } from "./RequireModule";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ChangePasswordPage } from "@/pages/auth/ChangePasswordPage";
import type { ModuleKey } from "@/constants/permissions";

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const LeadsPage = lazy(() => import("@/pages/leads/LeadsPage").then((m) => ({ default: m.LeadsPage })));
const LeadDetailPage = lazy(() => import("@/pages/leads/LeadDetailPage").then((m) => ({ default: m.LeadDetailPage })));
const ApplicantsPage = lazy(() => import("@/pages/applicants/ApplicantsPage").then((m) => ({ default: m.ApplicantsPage })));
const ApplicantDetailPage = lazy(() => import("@/pages/applicants/ApplicantDetailPage").then((m) => ({ default: m.ApplicantDetailPage })));
const ApplicationsPage = lazy(() => import("@/pages/applications/ApplicationsPage").then((m) => ({ default: m.ApplicationsPage })));
const ApplicationDetailPage = lazy(() =>
  import("@/pages/applications/ApplicationDetailPage").then((m) => ({ default: m.ApplicationDetailPage })),
);
const AppointmentsPage = lazy(() => import("@/pages/appointments/AppointmentsPage").then((m) => ({ default: m.AppointmentsPage })));
const DocumentsPage = lazy(() => import("@/pages/documents/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const StudentDocumentWorkspacePage = lazy(() =>
  import("@/pages/documents/StudentDocumentWorkspacePage").then((m) => ({ default: m.StudentDocumentWorkspacePage })),
);
const PaymentsPage = lazy(() => import("@/pages/payments/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const TasksPage = lazy(() => import("@/pages/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const UsersPage = lazy(() => import("@/pages/users/UsersPage").then((m) => ({ default: m.UsersPage })));
const AcademicPage = lazy(() => import("@/pages/academic/AcademicPage").then((m) => ({ default: m.AcademicPage })));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));

const PeopleDirectoryPage = lazy(() => import("@/pages/people/PeopleDirectoryPage").then((m) => ({ default: m.PeopleDirectoryPage })));
const EmployeeProfilePage = lazy(() => import("@/pages/people/EmployeeProfilePage").then((m) => ({ default: m.EmployeeProfilePage })));
const DepartmentsPage = lazy(() => import("@/pages/people/DepartmentsPage").then((m) => ({ default: m.DepartmentsPage })));
const AttendancePage = lazy(() => import("@/pages/attendance/AttendancePage").then((m) => ({ default: m.AttendancePage })));
const LeavePage = lazy(() => import("@/pages/leave/LeavePage").then((m) => ({ default: m.LeavePage })));
const PayrollPage = lazy(() => import("@/pages/payroll/PayrollPage").then((m) => ({ default: m.PayrollPage })));
const ResponsibilitiesPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.ResponsibilitiesPage })));
const ContactsPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.ContactsPage })));
const CommunicationPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.CommunicationPage })));
const MarketingPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.MarketingPage })));
const AutomationPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.AutomationPage })));
const ReportsPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.ReportsPage })));
const AuditLogsPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.AuditLogsPage })));
const ResourcesPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.ResourcesPage })));
const AIAssistantPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.AIAssistantPage })));
const IntegrationsPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.IntegrationsPage })));
const RolesPermissionsPage = lazy(() => import("@/pages/tier-b/RolesPermissionsPage").then((m) => ({ default: m.RolesPermissionsPage })));
const InvoicesExpensesPage = lazy(() => import("@/pages/tier-b").then((m) => ({ default: m.InvoicesExpensesPage })));
const WorkflowTemplatesPage = lazy(() => import("@/pages/workflow/WorkflowTemplatesPage").then((m) => ({ default: m.WorkflowTemplatesPage })));
const WorkflowTemplateBuilderPage = lazy(() =>
  import("@/pages/workflow/WorkflowTemplateBuilderPage").then((m) => ({ default: m.WorkflowTemplateBuilderPage })),
);

function PageFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function withModule(module: ModuleKey, element: ReactNode) {
  return (
    <RequireModule module={module}>
      <Suspense fallback={<PageFallback />}>{element}</Suspense>
    </RequireModule>
  );
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: "/change-password", element: <ChangePasswordPage /> }],
      },
      {
        element: <AppShell />,
        children: [
          { path: "/", element: withModule("dashboard", <DashboardPage />) },
          { path: "/leads", element: withModule("leads", <LeadsPage />) },
          { path: "/leads/:leadId", element: withModule("leads", <LeadDetailPage />) },
          { path: "/applicants", element: withModule("applicants", <ApplicantsPage />) },
          { path: "/applicants/:userId", element: withModule("applicants", <ApplicantDetailPage />) },
          { path: "/applications", element: withModule("applications", <ApplicationsPage />) },
          { path: "/applications/:applicationId", element: withModule("applications", <ApplicationDetailPage />) },
          { path: "/appointments", element: withModule("appointments", <AppointmentsPage />) },
          { path: "/documents", element: withModule("documents", <DocumentsPage />) },
          { path: "/documents/:studentId", element: withModule("documents", <StudentDocumentWorkspacePage />) },
          { path: "/payments", element: withModule("payments", <PaymentsPage />) },
          { path: "/tasks", element: withModule("tasks", <TasksPage />) },
          { path: "/notifications", element: withModule("notifications", <NotificationsPage />) },
          { path: "/users", element: withModule("users", <UsersPage />) },
          { path: "/academic/:tab?", element: withModule("academic", <AcademicPage />) },
          { path: "/people", element: withModule("people", <PeopleDirectoryPage />) },
          { path: "/people/departments", element: withModule("departments", <DepartmentsPage />) },
          { path: "/people/:employeeId", element: withModule("people", <EmployeeProfilePage />) },
          { path: "/attendance", element: withModule("attendance", <AttendancePage />) },
          { path: "/leave", element: withModule("leave", <LeavePage />) },
          { path: "/payroll", element: withModule("payroll", <PayrollPage />) },
          { path: "/responsibilities", element: withModule("responsibilities", <ResponsibilitiesPage />) },
          { path: "/contacts", element: withModule("contacts", <ContactsPage />) },
          { path: "/communication", element: withModule("communication", <CommunicationPage />) },
          { path: "/marketing", element: withModule("marketing", <MarketingPage />) },
          { path: "/automation", element: withModule("automation", <AutomationPage />) },
          { path: "/reports", element: withModule("reports", <ReportsPage />) },
          { path: "/audit-logs", element: withModule("auditLogs", <AuditLogsPage />) },
          { path: "/resources", element: withModule("resources", <ResourcesPage />) },
          { path: "/ai-assistant", element: withModule("aiAssistant", <AIAssistantPage />) },
          { path: "/integrations", element: withModule("integrations", <IntegrationsPage />) },
          { path: "/roles-permissions", element: withModule("rolesPermissions", <RolesPermissionsPage />) },
          { path: "/invoices-expenses", element: withModule("invoicesExpenses", <InvoicesExpensesPage />) },
          { path: "/workflow", element: withModule("workflow", <WorkflowTemplatesPage />) },
          { path: "/workflow/:templateId", element: withModule("workflow", <WorkflowTemplateBuilderPage />) },
          { path: "/settings", element: withModule("settings", <SettingsPage />) },
        ],
      },
    ],
  },
]);
