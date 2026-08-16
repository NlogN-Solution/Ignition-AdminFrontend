import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AvatarUploader } from "@/modules/profile/AvatarUploader";
import { PersonalInfoCard } from "@/modules/profile/PersonalInfoCard";
import { StudentDetailsCard } from "@/modules/profile/StudentDetailsCard";
import { EducationHistoryCard } from "@/modules/profile/EducationHistoryCard";
import { WorkExperienceCard } from "@/modules/profile/WorkExperienceCard";
import { DocumentExtractionCard } from "@/modules/profile/DocumentExtractionCard";
import { useAuthStore } from "@/services/authStore";
import { UserRole } from "@/types/enums";
import { toTitleCase } from "@/utils/format";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === UserRole.STUDENT;

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal information and account details." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-4">
            <AvatarUploader />
          </section>

          <PersonalInfoCard />

          {isStudent && user && (
            <>
              <StudentDetailsCard userId={user.id} />
              <EducationHistoryCard userId={user.id} />
              <WorkExperienceCard userId={user.id} />
              <DocumentExtractionCard userId={user.id} />
            </>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">Account</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Role</p>
                <p className="text-foreground">{user ? toTitleCase(user.role) : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Status</p>
                {user && <StatusBadge status={user.status} />}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Role and account status are managed by your workspace administrator.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
