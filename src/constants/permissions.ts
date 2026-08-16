import { UserRole } from "@/types/enums";

const ALL_ROLES = Object.values(UserRole);

/**
 * Mirrors backend/app/routes/*.py `require_role(...)` sets exactly — see the
 * backend inventory. A role not listed here for a module gets no nav entry
 * and no route access for it, because the API would 403 anyway.
 *
 * `super_admin` is implicitly allowed everywhere — the backend's `require_role`
 * dependency always passes it regardless of the listed roles, so it's included
 * in every entry below to keep this matrix a truthful mirror of enforcement.
 */
export const MODULE_ROLES = {
  // Every role gets a role-scoped dashboard now — see modules/dashboard.
  dashboard: ALL_ROLES,
  leads: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR, UserRole.MARKETING],
  applicants: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR],
  applications: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR, UserRole.ADMISSIONS, UserRole.STUDENT],
  appointments: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR, UserRole.SUPPORT, UserRole.STUDENT],
  documents: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR, UserRole.ADMISSIONS, UserRole.MANAGER, UserRole.STUDENT],
  payments: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.STUDENT],
  tasks: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR, UserRole.SUPPORT],
  notifications: [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.COUNSELLOR,
    UserRole.STAFF,
    UserRole.FRONTDESK,
    UserRole.STUDENT,
    UserRole.FINANCE,
    UserRole.MARKETING,
    UserRole.SUPPORT,
    UserRole.ADMISSIONS,
    UserRole.MANAGER,
  ],
  users: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  academic: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR],
  // People (Phase 1: Directory, Employee Profile, Departments — real, backed
  // by GET /employees, /users/{id}/employee-profile, /departments). manager
  // added here to match those endpoints' actual role gates.
  people: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER],
  departments: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER],
  // Phase 2: real, backed by /attendance/*. Every non-student role — mirrors
  // the backend's STAFF_ROLES exactly (self-service check-in is a "you're
  // staff" thing, not a specific-role thing).
  attendance: [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MANAGER,
    UserRole.COUNSELLOR,
    UserRole.STAFF,
    UserRole.FRONTDESK,
    UserRole.FINANCE,
    UserRole.MARKETING,
    UserRole.SUPPORT,
    UserRole.ADMISSIONS,
  ],
  // Phase 3: real, backed by /leave-requests, /leave-types. Same broad
  // self-service role list as attendance.
  leave: [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MANAGER,
    UserRole.COUNSELLOR,
    UserRole.STAFF,
    UserRole.FRONTDESK,
    UserRole.FINANCE,
    UserRole.MARKETING,
    UserRole.SUPPORT,
    UserRole.ADMISSIONS,
  ],
  // Phase 4: real, backed by /payroll-runs, /payslips, /salary-structures.
  // Broadened so every staff role can reach the page to see their own
  // payslip history — in-page actions (generate/finalize/mark-paid) stay
  // admin/super_admin-only, gated locally in PayrollPage, not here.
  payroll: [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MANAGER,
    UserRole.COUNSELLOR,
    UserRole.STAFF,
    UserRole.FRONTDESK,
    UserRole.FINANCE,
    UserRole.MARKETING,
    UserRole.SUPPORT,
    UserRole.ADMISSIONS,
  ],
  responsibilities: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  contacts: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR],
  communication: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR],
  marketing: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MARKETING],
  automation: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  reports: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  // Real data now — backed by GET /activity-logs.
  auditLogs: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  resources: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR, UserRole.STAFF],
  aiAssistant: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COUNSELLOR],
  integrations: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  rolesPermissions: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  invoicesExpenses: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  workflow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  settings: ALL_ROLES,
} as const;

export type ModuleKey = keyof typeof MODULE_ROLES;

export function canAccessModule(role: UserRole | undefined, module: ModuleKey): boolean {
  if (!role) return false;
  if (role === UserRole.SUPER_ADMIN) return true;
  return (MODULE_ROLES[module] as readonly UserRole[]).includes(role);
}

// `canAccessPlatformAdmin` is gone with the tenancy strip: there is no platform
// above this single tenant, so super_admin is simply the top of MODULE_ROLES.

export function isManagerRole(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/** GET /users(/{id}) also allows counsellor, scoped server-side to student accounts only. */
export function canBrowseApplicants(role: UserRole | undefined): boolean {
  return isManagerRole(role) || role === UserRole.COUNSELLOR;
}

/**
 * Mirrors backend/app/core/rbac.py's ROLE_RANK exactly — used client-side to
 * hide/disable actions a user can't take. The backend is still the real gate;
 * this only keeps the UI from offering actions that would 403.
 */
export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.STUDENT]: 0,
  [UserRole.COUNSELLOR]: 1,
  [UserRole.FRONTDESK]: 1,
  [UserRole.STAFF]: 1,
  [UserRole.FINANCE]: 1,
  [UserRole.MARKETING]: 1,
  [UserRole.SUPPORT]: 1,
  [UserRole.ADMISSIONS]: 1,
  [UserRole.MANAGER]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};

export function canManageTarget(actingRole: UserRole | undefined, targetRole: UserRole, newRole?: UserRole): boolean {
  if (!actingRole) return false;
  if (actingRole === UserRole.SUPER_ADMIN) return true;
  const actingRank = ROLE_RANK[actingRole] ?? 0;
  const targetRank = ROLE_RANK[targetRole] ?? 0;
  if (actingRank <= targetRank) return false;
  if (newRole !== undefined) {
    const newRank = ROLE_RANK[newRole] ?? 0;
    if (actingRank <= newRank) return false;
  }
  return true;
}
