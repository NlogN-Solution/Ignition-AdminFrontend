import { FileText, KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useStudentProfile } from "@/modules/users/hooks";
import { EnablePortalDialog } from "@/modules/users/EnablePortalDialog";
import { FullProfileSheet } from "@/modules/profile/FullProfileSheet";
import { StudentResearchCard } from "@/modules/profile/StudentResearchCard";
import { StudentShortlistCard } from "@/modules/profile/StudentShortlistCard";
import type { UserRead } from "@/modules/users/types";
import { formatCurrency } from "@/utils/format";

interface LeadClientSummaryCardProps {
  user: UserRead;
  fullProfileOpen: boolean;
  onFullProfileOpenChange: (open: boolean) => void;
  portalOpen: boolean;
  onPortalOpenChange: (open: boolean) => void;
  /**
   * Opens the page's one application dialog, optionally prefilled.
   *
   * A university alone is what the *research* shortlist can offer — the public
   * site never records which course. The portal shortlist does, so it passes
   * both.
   */
  onStartApplication: (universityId?: string, programId?: string) => void;
}

/**
 * What the lead page shows once someone is a client: the student account behind the
 * lead. It replaces the old Applicants detail page's profile section — deliberately
 * shorter, because everything it used to preview (documents, payments, appointments,
 * tasks) has its own module and its own page.
 *
 * `education_level` is not shown. Conversion writes `BACHELOR` into it as a NOT-NULL
 * placeholder (`lead_service.convert_lead`), so rendering it here would state as fact
 * something nobody told us.
 */
export function LeadClientSummaryCard({
  user,
  fullProfileOpen,
  onFullProfileOpenChange,
  portalOpen,
  onPortalOpenChange,
  onStartApplication,
}: LeadClientSummaryCardProps) {
  const { data: profile, isLoading } = useStudentProfile(user.id);

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">Student account</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          {user.has_portal_access ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              <KeyRound className="h-3 w-3" /> Portal active
            </span>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onPortalOpenChange(true)}>
              <KeyRound className="h-3 w-3" /> Enable portal
            </Button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !profile ? (
          <EmptyState
            icon={FileText}
            title="No profile details yet"
            description="Nationality, passport and study preferences live on the full profile."
            action={
              <Button size="sm" onClick={() => onFullProfileOpenChange(true)}>
                <Plus className="h-3.5 w-3.5" /> Add details
              </Button>
            }
            className="border-none py-6"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Field label="Nationality" value={profile.nationality} />
            <Field label="Passport no." value={profile.passport_number} />
            <Field label="Preferred country" value={profile.preferred_country} />
            <Field label="Preferred program" value={profile.preferred_program} />
            <Field label="Preferred intake" value={profile.preferred_intake} />
            <Field label="Budget" value={profile.budget ? formatCurrency(profile.budget) : undefined} />
          </div>
        )}
      </section>

      {/* Renders nothing unless they arrived from the public site with research attached. */}
      <StudentResearchCard
        studentId={user.id}
        research={profile?.preferences?.research}
        onStartApplication={(universityId) => onStartApplication(universityId)}
      />

      {/* And nothing unless they have shortlisted something in the portal.
          Below the research card because it is the later, firmer signal:
          research is what they were browsing before they had an account, this
          is what they chose after. */}
      <StudentShortlistCard
        studentId={user.id}
        onStartApplication={(universityId, programId) => onStartApplication(universityId, programId)}
      />

      <FullProfileSheet
        userId={user.id}
        name={`${user.first_name} ${user.last_name}`}
        open={fullProfileOpen}
        onOpenChange={onFullProfileOpenChange}
      />
      <EnablePortalDialog user={user} open={portalOpen} onOpenChange={onPortalOpenChange} />
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-foreground">{value ?? "—"}</p>
    </div>
  );
}
