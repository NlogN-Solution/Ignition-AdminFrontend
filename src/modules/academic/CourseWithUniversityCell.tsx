import { Skeleton } from "@/components/ui/skeleton";
import { useProgram, useUniversity } from "./hooks";

/**
 * A course, with the institution that runs it underneath.
 *
 * The applications list used to show the course name alone, which is only half
 * an answer: "Master of Information Technology" is offered by a dozen
 * universities and the one a row is about is the whole point of the row. The
 * university is the second line rather than a column of its own because the two
 * are one fact — you never want one without the other — and a separate column
 * would have cost width the list does not have.
 *
 * Two chained queries: the program resolves the `university_id`, which resolves
 * the university. Both are React Query cached, so a list where every row is the
 * same university costs one request, not twenty.
 */
export function CourseWithUniversityCell({ programId }: { programId: string | null }) {
  const { data: program, isLoading } = useProgram(programId ?? undefined);
  const { data: university } = useUniversity(program?.university_id);

  if (!programId) return <span className="text-muted-foreground">—</span>;
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }
  if (!program) return <span className="font-mono text-xs text-muted-foreground">#{programId.slice(0, 8)}</span>;

  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">{program.name}</p>
      {university?.name && <p className="truncate text-[13px] text-muted-foreground">{university.name}</p>}
    </div>
  );
}
