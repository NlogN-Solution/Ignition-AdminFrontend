import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AvatarUploader } from "./AvatarUploader";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { StudentDetailsCard } from "./StudentDetailsCard";
import { EducationHistoryCard } from "./EducationHistoryCard";
import { WorkExperienceCard } from "./WorkExperienceCard";

export function FullProfileSheet({
  userId,
  name,
  open,
  onOpenChange,
}: {
  userId: string;
  name?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-full overflow-y-auto !max-w-none sm:!max-w-5xl">
        <SheetHeader>
          <SheetTitle>{name ? `${name}'s profile` : "Full profile"}</SheetTitle>
          <SheetDescription>Everything on file for this applicant — view and edit as needed.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <section className="rounded-xl border border-border bg-card p-4">
            <AvatarUploader userId={userId} />
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PersonalInfoCard userId={userId} />
            <StudentDetailsCard userId={userId} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EducationHistoryCard userId={userId} />
            <WorkExperienceCard userId={userId} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
