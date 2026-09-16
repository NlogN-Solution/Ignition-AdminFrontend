import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StudentProfilePanel } from "./StudentProfilePanel";

/**
 * The profile as a slide-over, for places that cannot give it a tab.
 *
 * Its body is `StudentProfilePanel`, which is also what the Profile tab on the
 * lead and the Applicant profile tab on the application render — one
 * definition of "the student's record", reachable three ways.
 */
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

        <div className="px-4 pb-6">
          <StudentProfilePanel userId={userId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
