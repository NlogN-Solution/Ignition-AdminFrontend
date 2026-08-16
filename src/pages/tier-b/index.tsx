import {
  ListChecks,
  Contact,
  Megaphone,
  Workflow,
  BarChart3,
  Library,
  Sparkles,
  Plug,
  Receipt,
} from "lucide-react";
import { ComingSoonPage } from "@/components/shared/ComingSoonPage";

export { RolesPermissionsPage } from "./RolesPermissionsPage";
export { ActivityLogsPage as AuditLogsPage } from "@/pages/system/ActivityLogsPage";
export { CommunicationPage } from "@/pages/communication/CommunicationPage";

export const ResponsibilitiesPage = () => (
  <ComingSoonPage title="Responsibilities" description="Assign ownership areas and recurring duties across the team." icon={ListChecks} />
);
export const ContactsPage = () => (
  <ComingSoonPage title="Contacts" description="A shared address book of partners, agents, and external contacts." icon={Contact} />
);
export const MarketingPage = () => (
  <ComingSoonPage title="Marketing" description="Campaigns, audiences, and channel performance." icon={Megaphone} />
);
export const AutomationPage = () => (
  <ComingSoonPage title="Automation" description="Trigger-based workflows that act on leads, tasks, and documents automatically." icon={Workflow} />
);
export const ReportsPage = () => (
  <ComingSoonPage title="Reports" description="Custom, saved, and scheduled reports beyond the dashboard." icon={BarChart3} />
);
export const ResourcesPage = () => (
  <ComingSoonPage title="Resources" description="A knowledge base for counsellors and applicants." icon={Library} />
);
export const AIAssistantPage = () => (
  <ComingSoonPage title="AI Assistant" description="Lead scoring, document review, and a chat assistant across the workspace." icon={Sparkles} />
);
export const IntegrationsPage = () => (
  <ComingSoonPage title="Integrations" description="Connect email, calendars, payment gateways, and messaging providers." icon={Plug} />
);
export const InvoicesExpensesPage = () => (
  <ComingSoonPage title="Invoices & Expenses" description="Generate invoices and track consultancy operating expenses." icon={Receipt} />
);
