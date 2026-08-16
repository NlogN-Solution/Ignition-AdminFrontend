import { useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, CalendarPlus, CheckSquare, UserCog, UserPlus, Wallet } from "lucide-react";
import { LeadFormDialog } from "@/modules/leads/LeadFormDialog";
import { TaskFormDialog } from "@/modules/tasks/TaskFormDialog";
import { AppointmentFormDialog } from "@/modules/appointments/AppointmentFormDialog";
import { PaymentFormDialog } from "@/modules/payments/PaymentFormDialog";

type Dialog = "lead" | "task" | "appointment" | "payment" | null;

export function QuickActions() {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);

  const actions = [
    { label: "Add applicant", icon: UserPlus, onClick: () => setDialog("lead") },
    { label: "Create task", icon: CheckSquare, onClick: () => setDialog("task") },
    { label: "Book appointment", icon: CalendarPlus, onClick: () => setDialog("appointment") },
    { label: "Record payment", icon: Wallet, onClick: () => setDialog("payment") },
    { label: "Assign counsellor", icon: UserCog, onClick: () => navigate("/leads") },
    { label: "Generate report", icon: BarChart3, onClick: () => navigate("/reports") },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Quick actions</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <action.icon className="h-4 w-4 text-primary" />
            <span className="text-[11.5px] font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>

      <LeadFormDialog open={dialog === "lead"} onOpenChange={(o) => setDialog(o ? "lead" : null)} />
      <TaskFormDialog open={dialog === "task"} onOpenChange={(o) => setDialog(o ? "task" : null)} />
      <AppointmentFormDialog open={dialog === "appointment"} onOpenChange={(o) => setDialog(o ? "appointment" : null)} />
      <PaymentFormDialog open={dialog === "payment"} onOpenChange={(o) => setDialog(o ? "payment" : null)} />
    </section>
  );
}
