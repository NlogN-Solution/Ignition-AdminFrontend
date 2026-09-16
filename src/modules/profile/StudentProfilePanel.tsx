import { AvatarUploader } from "./AvatarUploader";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { StudentDetailsCard } from "./StudentDetailsCard";
import { EducationHistoryCard } from "./EducationHistoryCard";
import { WorkExperienceCard } from "./WorkExperienceCard";

/**
 * Everything on file about an applicant, as a panel rather than a sheet.
 *
 * This is the body `FullProfileSheet` used to hold inline. It was only ever
 * reachable as a slide-over from one card on the lead page, which made the
 * student's own record — their passport details, their qualifications, their
 * work history, the things every conversation is actually about — the hardest
 * thing on the console to get to. It is now a tab on both the lead and the
 * application, and the sheet renders this same panel, so the three cannot
 * drift into three different ideas of what a profile is.
 *
 * The cards are unchanged and still editable in place; each fetches and saves
 * its own slice through `modules/profile/service`.
 */
export function StudentProfilePanel({ userId }: { userId: string }) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-card p-4 ring-1 ring-[var(--border)]">
        <AvatarUploader userId={userId} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PersonalInfoCard userId={userId} />
        <StudentDetailsCard userId={userId} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EducationHistoryCard userId={userId} />
        <WorkExperienceCard userId={userId} />
      </div>
    </div>
  );
}
