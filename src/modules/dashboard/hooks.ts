import { useQuery } from "@tanstack/react-query";
import { leadService } from "@/modules/leads/service";
import { applicationService } from "@/modules/applications/service";
import { taskService } from "@/modules/tasks/service";
import { appointmentService } from "@/modules/appointments/service";
import { paymentService } from "@/modules/payments/service";
import { userService } from "@/modules/users/service";
import { academicService } from "@/modules/academic/service";
import { ApplicationStatus, PaymentStatus, TaskStatus, UserRole } from "@/types/enums";

export function useDashboardCounts() {
  const applicants = useQuery({ queryKey: ["dashboard", "applicants"], queryFn: () => userService.list({ role: UserRole.STUDENT, limit: 1 }) });
  const leads = useQuery({ queryKey: ["dashboard", "leads"], queryFn: () => leadService.list({ limit: 1 }) });
  const rawLeads = useQuery({
    queryKey: ["dashboard", "leads-raw"],
    queryFn: () => leadService.list({ statuses: "new,contacted,follow_up", limit: 1 }),
  });
  const prospects = useQuery({ queryKey: ["dashboard", "leads-prospects"], queryFn: () => leadService.list({ status: "qualified", limit: 1 }) });
  const lostLeads = useQuery({ queryKey: ["dashboard", "leads-lost"], queryFn: () => leadService.list({ status: "lost", limit: 1 }) });
  const convertedLeads = useQuery({ queryKey: ["dashboard", "leads-converted"], queryFn: () => leadService.list({ status: "converted", limit: 1 }) });
  const hotLeads = useQuery({
    queryKey: ["dashboard", "leads-hot"],
    queryFn: () => leadService.list({ priority: "hot", exclude_status: "converted", limit: 1 }),
  });
  const warmLeads = useQuery({
    queryKey: ["dashboard", "leads-warm"],
    queryFn: () => leadService.list({ priority: "warm", exclude_status: "converted", limit: 1 }),
  });
  const coldLeads = useQuery({
    queryKey: ["dashboard", "leads-cold"],
    queryFn: () => leadService.list({ priority: "cold", exclude_status: "converted", limit: 1 }),
  });
  // No "assigned_to is null" filter exists server-side — pull a working set and count client-side.
  const unassignedSample = useQuery({
    queryKey: ["dashboard", "leads-unassigned-sample"],
    queryFn: () => leadService.list({ statuses: "new,contacted,follow_up", limit: 100 }),
  });
  const applications = useQuery({ queryKey: ["dashboard", "applications"], queryFn: () => applicationService.list({ limit: 1 }) });
  const offers = useQuery({
    queryKey: ["dashboard", "offers"],
    queryFn: () => applicationService.list({ status: ApplicationStatus.OFFER_RECEIVED, limit: 1 }),
  });
  const visaProcessing = useQuery({
    queryKey: ["dashboard", "visa"],
    queryFn: () => applicationService.list({ status: ApplicationStatus.VISA_PROCESSING, limit: 1 }),
  });
  const openTasks = useQuery({ queryKey: ["dashboard", "tasks"], queryFn: () => taskService.list({ status: TaskStatus.PENDING, limit: 1 }) });
  const appointments = useQuery({ queryKey: ["dashboard", "appointments"], queryFn: () => appointmentService.list({ limit: 1 }) });
  const universities = useQuery({ queryKey: ["dashboard", "universities"], queryFn: () => academicService.universities.list({ limit: 1 }) });
  const countries = useQuery({ queryKey: ["dashboard", "countries"], queryFn: () => academicService.countries.list({ limit: 1 }) });
  const courses = useQuery({ queryKey: ["dashboard", "courses"], queryFn: () => academicService.programs.list({ limit: 1 }) });
  const revenuePayments = useQuery({
    queryKey: ["dashboard", "revenue"],
    queryFn: () => paymentService.list({ status: PaymentStatus.COMPLETED, limit: 200 }),
  });

  const revenue = revenuePayments.data?.items.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const convertedCount = convertedLeads.data?.total ?? 0;
  const lostCount = lostLeads.data?.total ?? 0;
  const conversionRate = convertedCount + lostCount > 0 ? Math.round((convertedCount / (convertedCount + lostCount)) * 100) : 0;
  const unassignedCount = unassignedSample.data?.items.filter((l) => !l.assigned_to).length ?? 0;

  return {
    applicants: applicants.data?.total ?? 0,
    leads: leads.data?.total ?? 0,
    rawLeads: rawLeads.data?.total ?? 0,
    prospects: prospects.data?.total ?? 0,
    lostLeads: lostCount,
    hotLeads: hotLeads.data?.total ?? 0,
    warmLeads: warmLeads.data?.total ?? 0,
    coldLeads: coldLeads.data?.total ?? 0,
    unassignedLeads: unassignedCount,
    conversionRate,
    applications: applications.data?.total ?? 0,
    offers: offers.data?.total ?? 0,
    visaProcessing: visaProcessing.data?.total ?? 0,
    openTasks: openTasks.data?.total ?? 0,
    appointments: appointments.data?.total ?? 0,
    universities: universities.data?.total ?? 0,
    countries: countries.data?.total ?? 0,
    courses: courses.data?.total ?? 0,
    revenue,
    isLoading:
      applicants.isLoading ||
      leads.isLoading ||
      rawLeads.isLoading ||
      prospects.isLoading ||
      lostLeads.isLoading ||
      convertedLeads.isLoading ||
      hotLeads.isLoading ||
      warmLeads.isLoading ||
      coldLeads.isLoading ||
      unassignedSample.isLoading ||
      applications.isLoading ||
      offers.isLoading ||
      visaProcessing.isLoading ||
      openTasks.isLoading ||
      appointments.isLoading ||
      universities.isLoading ||
      countries.isLoading ||
      courses.isLoading ||
      revenuePayments.isLoading,
  };
}
