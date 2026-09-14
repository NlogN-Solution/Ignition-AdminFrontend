import { AlertTriangle, Building2, GraduationCap, Heart, Plus } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentShortlist } from "@/modules/users/hooks";
import { formatDate } from "@/utils/format";

/**
 * What the student shortlisted inside the portal, shown to whoever works their file.
 *
 * `student_saved_courses` and `student_saved_universities` have been written by
 * the student portal since it was built and read by **nothing**. A student
 * could shortlist twelve courses and their counsellor would open this page to a
 * blank space, then ask them on a call what they had been looking at. This is
 * the read side of a table that has only ever had a write side.
 *
 * It sits below `StudentResearchCard` and is deliberately a separate card
 * rather than merged into it. The two shortlists are not the same evidence:
 * research is anonymous browsing on the public site, carried across an origin
 * boundary in a URL fragment and resolved against the catalogue on a
 * best-effort basis; this is a signed-in student pointing at rows in the same
 * catalogue this console works in. Presenting them as one list would flatten a
 * real difference in how much either can be trusted.
 *
 * **A saved course carries further than a saved university.** The research card
 * can only offer "start an application at this institution", because a public
 * shortlist never records which course. Here it does — the student chose one —
 * so the button fills in the course as well, and the counsellor is confirming a
 * decision rather than making one on the student's behalf.
 */
export function StudentShortlistCard({
  studentId,
  onStartApplication,
}: {
  studentId: string | undefined;
  /** Opens the application dialog, prefilled with a university and optionally a course. */
  onStartApplication: (universityId: string, programId?: string) => void;
}) {
  const { data, isLoading } = useStudentShortlist(studentId);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-16 w-full" />
      </section>
    );
  }

  const courses = data?.courses ?? [];
  const universities = data?.universities ?? [];

  // Nothing saved is not worth a card. The student has an empty shortlist, and
  // an empty panel saying so on every lead page is noise on the many where the
  // conversation has moved past browsing.
  if (!courses.length && !universities.length) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          Shortlisted in the portal
        </h2>
        <span className="text-xs text-muted-foreground">
          {courses.length > 0 && `${courses.length} ${courses.length === 1 ? "course" : "courses"}`}
          {courses.length > 0 && universities.length > 0 && " · "}
          {universities.length > 0 &&
            `${universities.length} ${universities.length === 1 ? "university" : "universities"}`}
        </span>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Saved by the student while signed in, against this catalogue. Starting an
        application from a course fills in both the university and the course.
      </p>

      {courses.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Courses
          </p>
          <ul className="divide-y divide-border">
            {courses.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      course.university_name,
                      course.qualification,
                      course.course_level,
                      course.duration_years ? `${course.duration_years} yr` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                    {course.saved_at && ` · saved ${formatDate(course.saved_at)}`}
                  </p>
                </div>

                {/* Withdrawn since they saved it. Said, not hidden: "the course
                    your student shortlisted is no longer published" is the
                    conversation to have, and a silently shorter list is not. */}
                {!course.is_published && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Unpublished
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onStartApplication(course.university_id, course.id)}
                >
                  <Plus className="h-3 w-3" /> Start application
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {universities.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Universities
          </p>
          <ul className="divide-y divide-border">
            {universities.map((university) => (
              <li key={university.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <div className="min-w-0 flex-1">
                  {university.slug ? (
                    <Link
                      to={`/website/universities?q=${encodeURIComponent(university.slug)}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {university.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{university.name}</p>
                  )}
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
                  // Nothing published means no course to pick, so the dialog
                  // would open onto an empty list.
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
    </section>
  );
}
