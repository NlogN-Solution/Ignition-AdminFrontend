import {
  UserPlus,
  FileText,
  Inbox,
  FileCheck,
  ListChecks,
  Send,
  SendHorizontal,
  Search,
  CalendarClock,
  CalendarCheck,
  Award,
  CheckCircle2,
  Wallet,
  FileSignature,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Stethoscope,
  Fingerprint,
  Luggage,
  MapPin,
  PartyPopper,
  Flag,
  Star,
  Circle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus,
  FileText,
  Inbox,
  FileCheck,
  ListChecks,
  Send,
  SendHorizontal,
  Search,
  CalendarClock,
  CalendarCheck,
  Award,
  CheckCircle2,
  Wallet,
  FileSignature,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Stethoscope,
  Fingerprint,
  Luggage,
  MapPin,
  PartyPopper,
  Flag,
  Star,
};

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}

export function DynamicIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = resolveIcon(name);
  return <Icon className={className} />;
}
