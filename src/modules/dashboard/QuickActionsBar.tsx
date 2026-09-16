import { useState } from "react";
import { useNavigate } from "react-router";
import {
  BarChart3,
  CalendarPlus,
  CheckSquare,
  FilePlus2,
  Mail,
  MoreHorizontal,
  Upload,
  UserCog,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadFormDialog } from "@/modules/leads/LeadFormDialog";
import { TaskFormDialog } from "@/modules/tasks/TaskFormDialog";
import { AppointmentFormDialog } from "@/modules/appointments/AppointmentFormDialog";
import { PaymentFormDialog } from "@/modules/payments/PaymentFormDialog";
import { ApplicationFormDialog } from "@/modules/applications/ApplicationFormDialog";
import { DocumentUploadDialog } from "@/modules/documents/DocumentUploadDialog";

/**
 * The six things staff start from the dashboard, pinned to the bottom of it.
 *
 * ## Why it is pinned
 *
 * Quick Actions used to be the last widget in a draggable list — below the
 * task board, below the country charts, roughly two screens down. A panel of
 * shortcuts that you have to scroll past everything to reach is not a
 * shortcut; it is a section. Pinned to the viewport it is reachable from
 * anywhere on the page, which is the only arrangement that makes "quick" true.
 *
 * `sticky bottom-0` rather than `fixed`: it stays inside the page's own
 * column, so it does not overlap the global sidebar, does not need to know how
 * wide that sidebar is, and scrolls away naturally at the end of the document
 * instead of covering the last row forever.
 *
 * ## Six, then a menu
 *
 * The five most-used get a button each; everything else goes behind More
 * actions. That is not a judgement about importance — recording a payment
 * matters — it is about width: seven buttons on a laptop wrap to two rows and
 * the bar stops reading as a bar.
 *
 * Nothing here is new behaviour. Every action opens a dialog or a page that
 * already existed; this is where they are reachable from.
 */

type DialogKind = "lead" | "application" | "appointment" | "document" | "task" | "payment" | null;

interface Action {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function QuickActionsBar() {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogKind>(null);

  const primary: Action[] = [
    { label: "Add student", icon: UserPlus, onClick: () => setDialog("lead") },
    { label: "Add application", icon: FilePlus2, onClick: () => setDialog("application") },
    // Communication is a screen, not a dialog — composing a message needs a
    // thread to compose it into, and picking one is the first step.
    { label: "Send email", icon: Mail, onClick: () => navigate("/communication") },
    { label: "Schedule call", icon: CalendarPlus, onClick: () => setDialog("appointment") },
    { label: "Upload document", icon: Upload, onClick: () => setDialog("document") },
  ];

  const more: Action[] = [
    { label: "Create task", icon: CheckSquare, onClick: () => setDialog("task") },
    { label: "Record payment", icon: Wallet, onClick: () => setDialog("payment") },
    { label: "Assign counsellor", icon: UserCog, onClick: () => navigate("/leads") },
    { label: "Generate report", icon: BarChart3, onClick: () => navigate("/reports") },
  ];

  return (
    <>
      <div className="sticky bottom-0 z-30 -mx-4 mt-4 px-4 pb-4 sm:-mx-6 sm:px-6">
        <section className="flex flex-wrap items-center gap-2 rounded-2xl bg-card/95 p-3 shadow-[var(--shadow-float)] ring-1 ring-[var(--border)] backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:gap-3 sm:px-5">
          <h2 className="mr-1 shrink-0 text-[15px] font-semibold tracking-[-0.01em] text-foreground sm:mr-3">
            Quick actions
          </h2>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {primary.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <action.icon className="h-4 w-4 text-primary" strokeWidth={2} />
                <span className="whitespace-nowrap">{action.label}</span>
              </button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <MoreHorizontal className="h-4 w-4 text-primary" strokeWidth={2} />
                  <span className="whitespace-nowrap">More actions</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                {more.map((action) => (
                  <DropdownMenuItem key={action.label} onSelect={action.onClick}>
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>
      </div>

      <LeadFormDialog open={dialog === "lead"} onOpenChange={(o) => setDialog(o ? "lead" : null)} />
      <ApplicationFormDialog
        open={dialog === "application"}
        onOpenChange={(o) => setDialog(o ? "application" : null)}
      />
      <AppointmentFormDialog
        open={dialog === "appointment"}
        onOpenChange={(o) => setDialog(o ? "appointment" : null)}
      />
      <DocumentUploadDialog
        open={dialog === "document"}
        onOpenChange={(o) => setDialog(o ? "document" : null)}
      />
      <TaskFormDialog open={dialog === "task"} onOpenChange={(o) => setDialog(o ? "task" : null)} />
      <PaymentFormDialog
        open={dialog === "payment"}
        onOpenChange={(o) => setDialog(o ? "payment" : null)}
      />
    </>
  );
}
