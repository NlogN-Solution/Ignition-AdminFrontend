import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  IdCard,
  Languages,
  PhoneCall,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/services/authStore";
import { useApplications } from "@/modules/applications/hooks";
import { useDocuments } from "@/modules/documents/hooks";
import { useAppointments } from "@/modules/appointments/hooks";
import { usePayments } from "@/modules/payments/hooks";
import { usePrograms } from "@/modules/academic/hooks";
import { DocumentStatus, DocumentType, PaymentStatus } from "@/types/enums";
import { formatCurrency, formatDate, toTitleCase } from "@/utils/format";

const DOCUMENT_ICONS: Partial<Record<DocumentType, LucideIcon>> = {
  [DocumentType.PASSPORT]: IdCard,
  [DocumentType.CITIZENSHIP]: IdCard,
  [DocumentType.NATIONAL_ID]: IdCard,
  [DocumentType.ACADEMIC_TRANSCRIPT]: GraduationCap,
  [DocumentType.ACADEMIC_CERTIFICATE]: Award,
  [DocumentType.PROVISIONAL_CERTIFICATE]: Award,
  [DocumentType.ENGLISH_TEST]: Languages,
  [DocumentType.OFFER_LETTER]: FileText,
};

const APPOINTMENT_ICONS: Record<string, LucideIcon> = {
  video_call: Video,
  phone_call: PhoneCall,
};

export function MyProgressStats() {
  const studentId = useAuthStore((s) => s.user?.id);
  const { data: applications } = useApplications({ student_id: studentId, limit: 1 });
  const { data: pendingDocs } = useDocuments({ student_id: studentId, status: DocumentStatus.PENDING, limit: 1 });
  const { data: appointments } = useAppointments({ student_id: studentId, limit: 50 });
  const { data: payments } = usePayments({ student_id: studentId, limit: 100 });

  const upcomingAppointments = useMemo(
    () => (appointments?.items ?? []).filter((a) => a.start_time && new Date(a.start_time).getTime() > Date.now()).length,
    [appointments],
  );
  const outstandingBalance = useMemo(
    () =>
      (payments?.items ?? [])
        .filter((p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING)
        .reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      <StatCard label="Applications" value={applications?.total ?? 0} icon={GraduationCap} accent="primary" href="/applications" />
      <StatCard label="Documents pending review" value={pendingDocs?.total ?? 0} icon={ClipboardCheck} accent="warning" href="/documents" />
      <StatCard label="Upcoming appointments" value={upcomingAppointments} icon={CalendarDays} accent="info" href="/appointments" />
      <StatCard
        label="Outstanding balance"
        value={outstandingBalance}
        icon={Wallet}
        accent={outstandingBalance > 0 ? "danger" : "success"}
        format={(v) => formatCurrency(v)}
        href="/payments"
      />
    </div>
  );
}

export function MyApplicationsWidget() {
  const navigate = useNavigate();
  const studentId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useApplications({ student_id: studentId, limit: 10 });
  const { data: programs } = usePrograms({ limit: 200 });
  const programName = useMemo(() => new Map((programs?.items ?? []).map((p) => [p.id, p.name])), [programs]);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">My applications</h2>
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={GraduationCap} title="No applications yet" className="border-none py-8" />
      ) : (
        <ul className="space-y-2">
          {data.items.map((app) => (
            <li key={app.id}>
              <button
                onClick={() => navigate(`/applications/${app.id}`)}
                className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{programName.get(app.program_id) ?? "Program"}</span>
                <StatusBadge status={app.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MyDocumentsWidget() {
  const navigate = useNavigate();
  const studentId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useDocuments({ student_id: studentId, limit: 10 });

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">My documents</h2>
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={FileText} title="No documents uploaded" className="border-none py-8" />
      ) : (
        <ul className="space-y-1">
          {data.items.map((doc) => {
            const Icon = DOCUMENT_ICONS[doc.document_type] ?? FileText;
            const feedback = doc.rejection_reason ?? doc.remarks;
            return (
              <li key={doc.id}>
                <button
                  onClick={() => navigate("/documents")}
                  className="flex w-full flex-col gap-1 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="flex w-full items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{doc.title ?? toTitleCase(doc.document_type)}</span>
                    <StatusBadge status={doc.status} />
                  </span>
                  {feedback && (
                    <span className="ml-9.5 line-clamp-1 pl-0 text-[11.5px] text-muted-foreground">
                      {doc.status === DocumentStatus.REJECTED ? "Feedback: " : "Comment: "}
                      {feedback}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function MyAppointmentsWidget() {
  const navigate = useNavigate();
  const studentId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useAppointments({ student_id: studentId, limit: 10 });

  const upcoming = useMemo(
    () =>
      [...(data?.items ?? [])].sort(
        (a, b) =>
          (a.start_time ? new Date(a.start_time).getTime() : Infinity) -
          (b.start_time ? new Date(b.start_time).getTime() : Infinity),
      ),
    [data],
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">My appointments</h2>
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments scheduled" className="border-none py-8" />
      ) : (
        <ul className="space-y-2">
          {upcoming.map((appt) => {
            const Icon = APPOINTMENT_ICONS[appt.appointment_type] ?? CalendarDays;
            return (
              <li key={appt.id}>
                <button
                  onClick={() => navigate("/appointments")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{appt.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(appt.start_time)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function MyPaymentsWidget() {
  const navigate = useNavigate();
  const studentId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = usePayments({ student_id: studentId, limit: 10 });

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">My payments</h2>
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={Wallet} title="No payments recorded" className="border-none py-8" />
      ) : (
        <ul className="space-y-2">
          {data.items.map((payment) => (
            <li key={payment.id}>
              <button
                onClick={() => navigate("/payments")}
                className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{formatCurrency(payment.amount, payment.currency)}</span>
                <StatusBadge status={payment.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
