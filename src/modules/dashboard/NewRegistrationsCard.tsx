import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, UserRoundPlus } from "lucide-react";
import { leadService } from "@/modules/leads/service";
import type { LeadRead } from "@/modules/leads/types";
import { initials } from "@/utils/format";
import { ArrivalsCard, type ArrivalRow } from "./ArrivalsCard";

/**
 * Who just signed up on the student portal.
 *
 * ## Why this needed a card of its own
 *
 * When someone registers on the portal, the backend turns them into a lead —
 * `link_or_create_lead_for_student` either links them to an existing lead or
 * creates one, and stamps `registered_at`. What was missing is that *nobody was
 * told*. They are a raw lead (`new`), not a client: registration is free and
 * unvetted, so a sign-up is someone to qualify, and they climb the pipeline
 * like any other lead. This card is where they are noticed first.
 *
 * So: one card, at the top of the dashboard, answering one question. It is
 * half the width now and sits beside the applications waiting for review,
 * because the two are the same question about different arrivals and reading
 * them together is what "is anything waiting on us" actually means.
 *
 * ## The notifier
 *
 * Two things happen when someone registers. The backend raises a real
 * notification to everyone on the lead desk (`notify_desk_of_registration`), so
 * it is waiting in the bell whenever they next log in. And this card, while
 * somebody has the dashboard open, toasts the arrival as it happens.
 *
 * The toast fires from a high-water mark, not from a diff of the list: we keep
 * the newest `registered_at` we have already announced in `localStorage`, so a
 * refresh, a tab switch or a remount cannot re-announce the same person. The
 * first load of a fresh browser announces nothing at all — it only records where
 * the line is — because opening the console for the first time should not fire
 * five toasts about students who registered last week.
 */

const SEEN_KEY = "ignition:dashboard:last-registration-seen";
const POLL_MS = 60_000;

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    // Private windows and blocked site data both throw here. Losing the
    // high-water mark costs a duplicate toast, which is better than a
    // dashboard that will not render.
    return null;
  }
}

function writeSeen(value: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, value);
  } catch {
    /* see readSeen */
  }
}

/** Registrations, newest first. */
function useRecentRegistrations() {
  return useQuery({
    queryKey: ["dashboard", "registrations"],
    // `registered=true` returns only portal sign-ups, newest sign-up first,
    // whatever stage the lead is now at.
    queryFn: () => leadService.list({ registered: true, limit: 50 }),
    refetchInterval: POLL_MS,
    select: (page) => {
      const items = page.items.filter((l): l is LeadRead & { registered_at: string } => Boolean(l.registered_at));
      return { items, total: items.length };
    },
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many of `dates` fall in the window `[from, to)` days ago. */
function countInWindow(dates: string[], fromDaysAgo: number, toDaysAgo: number) {
  const now = Date.now();
  return dates.filter((iso) => {
    const age = now - new Date(iso).getTime();
    return age >= fromDaysAgo * DAY_MS && age < toDaysAgo * DAY_MS;
  }).length;
}

export function NewRegistrationsCard() {
  const { data, isLoading } = useRecentRegistrations();
  const items = useMemo(() => data?.items ?? [], [data]);
  // Set on the first poll so the announce effect can tell "first ever load"
  // from "a new one arrived".
  const primed = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;
    const newest = items[0].registered_at;
    const seen = readSeen();

    if (!seen || !primed.current) {
      // First sight of the list in this browser (or this mount). Record where
      // the line is and announce nothing.
      primed.current = true;
      if (!seen) writeSeen(newest);
      return;
    }

    const fresh = items.filter((l) => new Date(l.registered_at) > new Date(seen));
    if (fresh.length === 0) return;

    const first = `${fresh[0].first_name} ${fresh[0].last_name ?? ""}`.trim();
    toast.success(
      fresh.length === 1
        ? `${first} just registered on the portal — they are now a lead.`
        : `${first} and ${fresh.length - 1} other${fresh.length > 2 ? "s" : ""} just registered on the portal.`,
      { icon: <Sparkles className="h-4 w-4" />, duration: 8000 },
    );
    writeSeen(newest);
  }, [items]);

  /**
   * The list is capped at 50 rows, so the two windows are only trustworthy
   * while fewer than fifty people registered in a fortnight. At that point the
   * delta understates rather than invents, which is the right way round.
   */
  const dates = items.map((l) => l.registered_at);

  const rows: ArrivalRow[] = items.map((lead) => ({
    id: lead.id,
    name: `${lead.first_name} ${lead.last_name ?? ""}`.trim(),
    monogram: initials(lead.first_name, lead.last_name),
    detail: lead.email ?? lead.phone,
    at: lead.registered_at,
    to: `/leads/${lead.id}`,
  }));

  return (
    <ArrivalsCard
      icon={UserRoundPlus}
      tone="info"
      title="New student registrations"
      subtitle="Signed up on the portal — new leads to qualify"
      count={countInWindow(dates, 0, 7)}
      previous={countInWindow(dates, 7, 14)}
      rows={rows}
      isLoading={isLoading}
      emptyText="Nobody has registered on the portal yet. When they do, they appear here and on the Leads list the moment they finish signing up — and everyone on the lead desk gets a notification."
      viewAllTo="/leads?stage=new"
    />
  );
}
