import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  FileText,
  CalendarDays,
  Wallet,
  CheckSquare,
  ShieldCheck,
  Globe2,
  Building2,
  BookOpen,
  CalendarClock,
  Briefcase,
  Clock3,
  Banknote,
  ListChecks,
  Contact,
  MessageSquare,
  Megaphone,
  Workflow,
  BarChart3,
  ScrollText,
  Library,
  Sparkles,
  Plug,
  Lock,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "./permissions";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  module: ModuleKey;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard, module: "dashboard", end: true }],
  },
  {
    label: "Admissions",
    items: [
      { label: "Leads", path: "/leads", icon: UserPlus, module: "leads" },
      { label: "Applicants", path: "/applicants", icon: GraduationCap, module: "applicants" },
      { label: "Applications", path: "/applications", icon: FileText, module: "applications" },
      { label: "Appointments", path: "/appointments", icon: CalendarDays, module: "appointments" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Documents", path: "/documents", icon: FileText, module: "documents" },
      { label: "Payments", path: "/payments", icon: Wallet, module: "payments" },
      { label: "Tasks", path: "/tasks", icon: CheckSquare, module: "tasks" },
    ],
  },
  {
    label: "Academic data",
    items: [
      { label: "Countries", path: "/academic/countries", icon: Globe2, module: "academic" },
      { label: "Universities", path: "/academic/universities", icon: Building2, module: "academic" },
      { label: "Courses", path: "/academic/programs", icon: BookOpen, module: "academic" },
      { label: "Intakes", path: "/academic/intakes", icon: CalendarClock, module: "academic" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Users & Staff", path: "/users", icon: ShieldCheck, module: "users" },
      { label: "Directory", path: "/people", icon: Users, module: "people" },
      { label: "Departments", path: "/people/departments", icon: Briefcase, module: "departments" },
      { label: "Attendance", path: "/attendance", icon: Clock3, module: "attendance" },
      { label: "Leave", path: "/leave", icon: CalendarClock, module: "leave" },
      { label: "Payroll", path: "/payroll", icon: Banknote, module: "payroll" },
      { label: "Duties", path: "/responsibilities", icon: ListChecks, module: "responsibilities" },
      { label: "Contacts", path: "/contacts", icon: Contact, module: "contacts" },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Communication", path: "/communication", icon: MessageSquare, module: "communication" },
      { label: "Marketing", path: "/marketing", icon: Megaphone, module: "marketing" },
      { label: "Automation", path: "/automation", icon: Workflow, module: "automation" },
      { label: "Reports", path: "/reports", icon: BarChart3, module: "reports" },
      { label: "AI Assistant", path: "/ai-assistant", icon: Sparkles, module: "aiAssistant" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Invoices & Expenses", path: "/invoices-expenses", icon: Receipt, module: "invoicesExpenses" },
      { label: "Workflow Management", path: "/workflow", icon: Workflow, module: "workflow" },
      { label: "Roles & Permissions", path: "/roles-permissions", icon: Lock, module: "rolesPermissions" },
      { label: "Audit Logs", path: "/audit-logs", icon: ScrollText, module: "auditLogs" },
      { label: "Resources", path: "/resources", icon: Library, module: "resources" },
      { label: "Integrations", path: "/integrations", icon: Plug, module: "integrations" },
      { label: "Settings", path: "/settings", icon: Settings, module: "settings" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
