// One key factory per module keeps invalidation predictable — see TanStack Query docs' "query key factory" pattern.
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: unknown) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  studentProfile: {
    detail: (userId: string) => ["student-profile", userId] as const,
  },
  employeeProfile: {
    detail: (userId: string) => ["employee-profile", userId] as const,
    timeline: (userId: string) => ["employee-profile", userId, "timeline"] as const,
  },
  departments: {
    all: ["departments"] as const,
    list: (params: unknown) => ["departments", "list", params] as const,
    detail: (id: string) => ["departments", "detail", id] as const,
  },
  employeeDirectory: {
    all: ["employee-directory"] as const,
    list: (params: unknown) => ["employee-directory", "list", params] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    policy: ["attendance", "policy"] as const,
    today: ["attendance", "today"] as const,
    list: (params: unknown) => ["attendance", "list", params] as const,
    dashboard: (targetDate: string | undefined) => ["attendance", "dashboard", targetDate ?? "today"] as const,
    employeeSummary: (employeeId: string, year: number | undefined, month: number | undefined) =>
      ["attendance", "employee-summary", employeeId, year, month] as const,
  },
  leaveTypes: {
    all: ["leave-types"] as const,
  },
  leaveRequests: {
    all: ["leave-requests"] as const,
    list: (params: unknown) => ["leave-requests", "list", params] as const,
    detail: (id: string) => ["leave-requests", "detail", id] as const,
    balance: (employeeId: string, year: number | undefined) => ["leave-requests", "balance", employeeId, year] as const,
  },
  salaryStructure: {
    detail: (userId: string) => ["salary-structure", userId] as const,
  },
  payrollRuns: {
    all: ["payroll-runs"] as const,
    list: (params: unknown) => ["payroll-runs", "list", params] as const,
    detail: (id: string) => ["payroll-runs", "detail", id] as const,
    payslips: (runId: string) => ["payroll-runs", runId, "payslips"] as const,
  },
  payslips: {
    detail: (id: string) => ["payslips", "detail", id] as const,
    employeeHistory: (userId: string) => ["payslips", "employee-history", userId] as const,
  },
  studentEducation: {
    list: (userId: string) => ["student-education", userId] as const,
  },
  studentExperience: {
    list: (userId: string) => ["student-experience", userId] as const,
  },
  activityLogs: {
    all: ["activity-logs"] as const,
    list: (params: unknown) => ["activity-logs", "list", params] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: (params: unknown) => ["leads", "list", params] as const,
    detail: (id: string) => ["leads", "detail", id] as const,
    activities: (id: string) => ["leads", "activities", id] as const,
  },
  applications: {
    all: ["applications"] as const,
    list: (params: unknown) => ["applications", "list", params] as const,
    detail: (id: string) => ["applications", "detail", id] as const,
    statusHistory: (id: string) => ["applications", "status-history", id] as const,
  },
  appointments: {
    all: ["appointments"] as const,
    list: (params: unknown) => ["appointments", "list", params] as const,
    detail: (id: string) => ["appointments", "detail", id] as const,
  },
  documents: {
    all: ["documents"] as const,
    list: (params: unknown) => ["documents", "list", params] as const,
    detail: (id: string) => ["documents", "detail", id] as const,
    folders: (params: unknown) => ["documents", "folders", params] as const,
    folder: (studentId: string) => ["documents", "folder", studentId] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (params: unknown) => ["payments", "list", params] as const,
    detail: (id: string) => ["payments", "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (params: unknown) => ["tasks", "list", params] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params: unknown) => ["notifications", "list", params] as const,
  },
  messages: {
    all: ["messages"] as const,
    threads: ["messages", "threads"] as const,
    thread: (studentId: string) => ["messages", "thread", studentId] as const,
  },
  academic: {
    countries: (params: unknown) => ["academic", "countries", params] as const,
    universities: (params: unknown) => ["academic", "universities", params] as const,
    programs: (params: unknown) => ["academic", "programs", params] as const,
    intakes: (params: unknown) => ["academic", "intakes", params] as const,
  },
  dashboard: {
    overview: ["dashboard", "overview"] as const,
  },
} as const;
