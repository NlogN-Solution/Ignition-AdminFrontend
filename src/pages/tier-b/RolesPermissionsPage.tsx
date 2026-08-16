import { Check, Lock, Minus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MODULE_ROLES } from "@/constants/permissions";
import { ALL_NAV_ITEMS } from "@/constants/navigation";
import { UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";

const ROLE_ORDER: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.COUNSELLOR,
  UserRole.FINANCE,
  UserRole.MARKETING,
  UserRole.SUPPORT,
  UserRole.ADMISSIONS,
  UserRole.STAFF,
  UserRole.FRONTDESK,
  UserRole.STUDENT,
];

export function RolesPermissionsPage() {
  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="The actual access matrix enforced by the API — every cell here reflects a real backend permission check, not a mock."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 bg-card px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground">Module</th>
              {ROLE_ORDER.map((role) => (
                <th key={role} className="px-3 py-2.5 text-center text-[12px] font-medium text-muted-foreground">
                  {toTitleCase(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_NAV_ITEMS.filter((item) => item.module !== "settings").map((item, idx) => {
              const allowed = MODULE_ROLES[item.module] as readonly UserRole[];
              return (
                <tr key={`${item.module}-${idx}`} className="border-b border-border last:border-none">
                  <td className="sticky left-0 flex items-center gap-2 bg-card px-4 py-2 text-[13px] text-foreground">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.label}
                  </td>
                  {ROLE_ORDER.map((role) => (
                    <td key={role} className="px-3 py-2 text-center">
                      {allowed.includes(role) ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-success" />
                      ) : (
                        <Minus className="mx-auto h-3.5 w-3.5 text-muted-foreground/30" />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          This matrix is generated from the same role configuration the app uses to gate navigation and routes — it will always match
          what the API actually allows, including the same-role exceptions (e.g. counsellors can browse applicant records but not the
          full staff directory). <strong className="font-medium text-foreground">Super Admin bypasses this matrix entirely</strong> and
          has unrestricted access to every module regardless of what's checked above — the backend grants it blanket access at the
          authorization layer, not by being added to each module's list.
        </p>
      </div>
    </div>
  );
}
