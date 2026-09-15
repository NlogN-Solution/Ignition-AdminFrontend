import { Activity, Clock, FileText, Home, MessageSquare, NotebookPen, Route, type LucideIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * The application's own navigation — one section visible at a time.
 *
 * This is the change the redesign is really about. The page used to render
 * Overview, Status History, Journey and the document checklist simultaneously,
 * which meant a staff member opening an application was handed four answers
 * before they had asked a question, and the thing they came for was somewhere
 * in the middle of a long scroll.
 *
 * Deliberately NOT a second global sidebar: the console's own sidebar is
 * untouched and this sits inside the page, scoped to one record.
 *
 * Three presentations of one list, by width — a vertical rail on wide desktop,
 * a scrollable tab row from `md` to `xl`, and a select below that, where six
 * tabs cannot be shown without either truncating them or pushing the content
 * below the fold.
 *
 * The rail waits for `lg`: with the journey back in the tab list there are only
 * two columns, so the content gets the whole of the rest of the page.
 */

export const APPLICATION_TABS = [
  { value: "overview", label: "Overview", icon: Home },
  { value: "journey", label: "Journey", icon: Route },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "status", label: "Status History", icon: Clock },
  { value: "notes", label: "Notes", icon: NotebookPen },
  { value: "activity", label: "Activity", icon: Activity },
  { value: "communication", label: "Communication", icon: MessageSquare },
] as const;

export type ApplicationTab = (typeof APPLICATION_TABS)[number]["value"];

export function isApplicationTab(value: string | null): value is ApplicationTab {
  return APPLICATION_TABS.some((t) => t.value === value);
}

interface Props {
  value: ApplicationTab;
  onChange: (tab: ApplicationTab) => void;
  /** Small trailing counts, e.g. documents outstanding. Omitted keys show nothing. */
  badges?: Partial<Record<ApplicationTab, string>>;
}

export function ApplicationSectionNav({ value, onChange, badges }: Props) {
  return (
    <>
      {/* Desktop: vertical rail */}
      <nav aria-label="Application sections" className="hidden lg:block">
        <ul className="space-y-0.5">
          {APPLICATION_TABS.map((tab) => (
            <li key={tab.value}>
              <NavButton tab={tab} active={tab.value === value} badge={badges?.[tab.value]} onClick={() => onChange(tab.value)} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Tablet and narrow desktop: scrollable tab row */}
      <nav aria-label="Application sections" className="hidden md:block lg:hidden">
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {APPLICATION_TABS.map((tab) => (
            <li key={tab.value} className="shrink-0">
              <NavButton tab={tab} active={tab.value === value} badge={badges?.[tab.value]} onClick={() => onChange(tab.value)} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: a select, because six tabs do not fit without truncating them */}
      <div className="md:hidden">
        <label htmlFor="application-section" className="sr-only">
          Application section
        </label>
        <Select value={value} onValueChange={(v) => onChange(v as ApplicationTab)}>
          <SelectTrigger id="application-section" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_TABS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function NavButton({
  tab,
  active,
  badge,
  onClick,
}: {
  tab: { value: ApplicationTab; label: string; icon: LucideIcon };
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground dark:hover:bg-white/[0.04]",
      )}
    >
      {/* The accent line, drawn only for the vertical rail — a 2px bar down the
          left of a horizontal tab would read as a divider between tabs. */}
      {active && (
        <span aria-hidden className="absolute inset-y-1.5 left-0 hidden w-[2.5px] rounded-full bg-primary lg:block" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} strokeWidth={2} />
      <span className="truncate">{tab.label}</span>
      {badge && (
        <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}
