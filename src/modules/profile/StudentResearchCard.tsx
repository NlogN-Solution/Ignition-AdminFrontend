import { Building2, Compass, GraduationCap, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useResearchShortlist } from "@/modules/users/hooks";
import type { StudentResearch } from "@/modules/users/types";
import { formatDate } from "@/utils/format";

/**
 * What the student explored on the public Ignition platform before they had an
 * account, shown to whoever is working their file.
 *
 * This is the most useful thing on the page for a first conversation: it is
 * the student's own stated direction, captured while they were deciding rather
 * than answered into a form afterwards.
 *
 * **It used to be read-only, and that was not a design choice — it was a
 * limitation.** The public site's ids were slugs of invented institutions with
 * no counterpart in `universities`, so there was nothing to click through to
 * and a counsellor retyped the shortlist into a new application. There is one
 * catalogue now, so the slugs resolve, and each shortlisted institution here
 * opens the application dialog against the real row.
 *
 * What has not changed is who decides. The button opens a dialog with the
 * student and the university filled in; the counsellor still picks the course
 * and still presses create. Resolving a name to a row makes the conversation
 * faster — it is not a substitute for having it.
 */
export function StudentResearchCard({
  studentId,
  research,
  onStartApplication,
}: {
  studentId: string | undefined;
  research: StudentResearch | undefined;
  /** Opens the application dialog prefilled with this university. */
  onStartApplication: (universityId: string) => void;
}) {
  const { data: shortlist } = useResearchShortlist(research ? studentId : undefined);

  if (!research) return null;

  const { career, courses = [], budget } = research;
  const resolved = shortlist?.universities ?? [];
  const carried = research.universities ?? [];

  if (!career && !courses.length && !carried.length && !resolved.length) return null;

  // A handoff minted before the catalogue import names institutions that never
  // existed. Saying so is better than showing a shortlist that cannot be acted
  // on and leaving a counsellor to wonder why.
  const stale = shortlist?.catalogue === "example";

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          Research from the Ignition site
        </h2>
        {research.importedAt && (
          <span className="text-xs text-muted-foreground">
            Imported {formatDate(research.importedAt)}
          </span>
        )}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        {stale
          ? "Captured before the catalogue import, so these names are from the old example data and do not link to catalogue records. The career goal and budget still hold."
          : "Shortlisted by the student while browsing the public platform, before signing up. Starting an application from one fills in the university — you choose the course."}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {career && (
          <Block icon={Compass} label="Career goal">
            <p className="font-medium text-foreground">{career.title}</p>
            {typeof career.match === "number" && (
              <p className="text-xs text-muted-foreground">{career.match}% quiz match</p>
            )}
          </Block>
        )}

        {courses.length > 0 && (
          <Block icon={GraduationCap} label={`Courses saved (${courses.length})`}>
            <ul className="space-y-0.5">
              {courses.map((course) => (
                <li key={course.id ?? course.title} className="text-foreground">
                  {course.title}
                  {course.qualification && (
                    <span className="text-muted-foreground"> · {course.qualification}</span>
                  )}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {/* The unresolved names, where there is nothing to resolve them to. */}
        {resolved.length === 0 && carried.length > 0 && (
          <Block icon={Building2} label={`Universities shortlisted (${carried.length})`}>
            <ul className="space-y-0.5">
              {carried.map((university) => (
                <li key={university.id ?? university.name} className="text-foreground">
                  {university.name}
                  {university.city && (
                    <span className="text-muted-foreground"> · {university.city}</span>
                  )}
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Universities shortlisted ({resolved.length})
          </p>

          <ul className="divide-y divide-border">
            {resolved.map((university) => (
              <li key={university.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/website/universities?q=${encodeURIComponent(university.slug)}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {university.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {[university.city, university.region].filter(Boolean).join(" · ") || "—"}
                    {university.course_count > 0 && ` · ${university.course_count} courses`}
                  </p>
                </div>

                {!university.is_published && <Badge variant="secondary">Unpublished</Badge>}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  // A university with nothing published has no course to pick,
                  // so the dialog would open onto an empty list.
                  disabled={university.course_count === 0}
                  title={
                    university.course_count === 0
                      ? "No published courses at this university yet"
                      : undefined
                  }
                  onClick={() => onStartApplication(university.id)}
                >
                  <Plus className="h-3 w-3" /> Start application
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shortlist && shortlist.unresolved.length > 0 && shortlist.catalogue === "live" && (
        <p className="mt-3 text-xs text-muted-foreground">
          {shortlist.unresolved.length} shortlisted{" "}
          {shortlist.unresolved.length === 1 ? "entry is" : "entries are"} no longer in the
          catalogue: <span className="font-mono">{shortlist.unresolved.join(", ")}</span>
        </p>
      )}

      {budget?.monthlyLiving != null && (
        <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
          Budgeted roughly{" "}
          <span className="font-medium text-foreground">
            £{budget.monthlyLiving.toLocaleString()}
          </span>{" "}
          a month for living costs
          {budget.annualTuition != null && (
            <>
              , tuition around{" "}
              <span className="font-medium text-foreground">
                £{budget.annualTuition.toLocaleString()}
              </span>{" "}
              a year
            </>
          )}
          .
        </p>
      )}
    </section>
  );
}

function Block({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Compass;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="mt-1.5 space-y-0.5 text-sm">{children}</div>
    </div>
  );
}
