import type { ApplicationRead } from "./types";

/**
 * The human-readable reference staff quote on the phone: `IGN-2026-004821`.
 *
 * ## Why it is derived and not stored
 *
 * There is no reference column on `applications` and no sequence behind one —
 * the only identifier a row has is its UUID, which is correct for a database
 * and useless for a person reading it aloud. Adding a real sequence means a
 * migration, a backfill for every existing application and a uniqueness
 * guarantee under concurrent inserts. That is worth doing, but it is a schema
 * change, and it is not what "show an IGN- id" asked for.
 *
 * So this is a *display* reference, derived from the two things every row
 * already has and neither of which ever changes: the year it was created, and
 * its id. That makes it stable — the same application shows the same reference
 * forever, on every screen, for every user — and collision-free within a year
 * to the extent the first 24 bits of a UUIDv4 are, which is roughly 1 in 16
 * million per pair.
 *
 * **It is not sequential.** `IGN-2026-004821` does not mean the 4,821st
 * application, and nothing should read it that way. If you later want a true
 * sequence, add the column and have this function prefer it — the call sites
 * will not change.
 *
 * The university's own reference (`university_application_id`) is deliberately
 * NOT used here. That is their number for the file, not ours, and showing it
 * where staff expect an Ignition id would mean the same application answers to
 * two different references depending on whether the university had replied yet.
 */
export function applicationReference(application: Pick<ApplicationRead, "id" | "created_at">): string {
  const year = new Date(application.created_at).getFullYear();
  const hex = application.id.replace(/-/g, "").slice(0, 6);
  const serial = (parseInt(hex, 16) % 1_000_000).toString().padStart(6, "0");
  return `IGN-${Number.isNaN(year) ? "0000" : year}-${serial}`;
}
