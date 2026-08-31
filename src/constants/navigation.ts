import {
  ClipboardCheck,
  LayoutDashboard,
  Newspaper,
  UserPlus,
  BookMarked,
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
  Award,
  Image,
  FileSpreadsheet,
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
      { label: "Eligibility", path: "/eligibility", icon: ClipboardCheck, module: "eligibility" },
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
    label: "Website",
    items: [
      { label: "Universities", path: "/website/universities", icon: Building2, module: "website" },
      { label: "Courses", path: "/website/courses", icon: BookOpen, module: "website" },
      { label: "Countries", path: "/website/countries", icon: Globe2, module: "academic" },
      { label: "Scholarships", path: "/website/scholarships", icon: Award, module: "website" },
      { label: "Pages", path: "/website/pages", icon: FileText, module: "website" },
      { label: "Guides", path: "/website/guides", icon: BookMarked, module: "website" },
      { label: "Blog", path: "/website/blog", icon: Newspaper, module: "website" },
      { label: "Media", path: "/website/media", icon: Image, module: "website" },
      { label: "Imports", path: "/website/imports", icon: FileSpreadsheet, module: "website" },
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
