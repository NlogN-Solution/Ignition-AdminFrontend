import { useProgram } from "./hooks";

/**
 * A course name on one line, for places that are already tight.
 *
 * `CourseWithUniversityCell` is the right cell for a table row, where the
 * institution is half the answer and there is room for a second line. This is
 * for a secondary line that is itself inside something — the dashboard's
 * arrivals card, where the row is a name, a course and a timestamp in about
 * three hundred pixels. It shares the same React Query cache entry, so using
 * one here costs nothing extra anywhere the other is already used.
 *
 * Renders inline, and renders nothing at all while loading: a skeleton for a
 * subtitle draws more attention than the subtitle.
 */
export function CourseNameCell({ programId }: { programId: string | null }) {
  const { data: program } = useProgram(programId ?? undefined);
  if (!programId) return null;
  return <>{program?.name ?? ""}</>;
}
