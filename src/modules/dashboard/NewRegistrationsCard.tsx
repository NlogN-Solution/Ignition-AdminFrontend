import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Sparkles, UserRoundPlus } from "lucide-react";
import { leadService } from "@/modules/leads/service";
import type { LeadRead } from "@/modules/leads/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Who just signed up on the student portal.
 *
 * ## Why this needed a card of its own
 *
 * When someone registers on the portal, the backend already turns them into a
 * lead — `link_or_create_lead_for_student` either links them to an existing lead
 * or creates one, with `conversion_source = registration_completed`. That has
 * worked for a while. What was missing is that *nobody was told*. The new lead
 * is created with status `converted`, so it sorted into the Clients tab, which
 * is the tab staff look at least often — the freshest, warmest enquiry in the
 * business landed in the quietest corner of the console and sat there.
 *
 * So: one card, pinned to the top of the dashboard — `alwaysFirst`, above the
 * stat row and above the reader's own pins, and not draggable out of that
 * position — answering one question.
 *
 * ## The notifier
 *
 * Two things happen when someone registers. The backend raises a real
 * notification to everyone on the lead desk (`notify_desk_of_registration`), so
 * it is waiting in the bell whenever they next log in. And this card, while
 * somebody has the dashboard open, toasts the arrival as it happens.
 *
 * The toast fires from a high-water mark, not from a diff of the list: we keep
 * the newest `converted_at` we have already announced in `localStorage`, so a
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
    // There is no "registered via portal" filter server-side, so this pulls the
    // clients page and narrows on `conversion_source` here. `converted` is a
    // small set and the alternative is a backend change for one widget.
    queryFn: () => leadService.list({ status: "converted" as LeadRead["status"], limit: 50 }),
    refetchInterval: POLL_MS,
    select: (page) => {
      const items = page.items
        .filter((l) => l.conversion_source === "registration_completed" && l.converted_at)
        .sort((a, b) => new Date(b.converted_at as string).getTime() - new Date(a.converted_at as string).getTime());
      return { items, total: items.length };
    },
  });
}

function isWithinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

export function NewRegistrationsCard() {
  const { data, isLoading } = useRecentRegistrations();
  const items = useMemo(() => data?.items ?? [], [data]);
  // Set on the first poll so the announce effect can tell "first ever load"
  // from "a new one arrived".
  const primed = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;
    const newest = items[0].converted_at as string;
    const seen = readSeen();

    if (!seen || !primed.current) {
      // First sight of the list in this browser (or this mount). Record where
      // the line is and announce nothing.
      primed.current = true;
      if (!seen) writeSeen(newest);
      return;
    }

    const fresh = items.filter((l) => new Date(l.converted_at as string) > new Date(seen));
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

  const thisWeek = items.filter((l) => isWithinDays(l.converted_at as string, 7)).length;

  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-card p-5 ring-1 ring-[var(--border)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-success opacity-[0.10] blur-3xl"
      />

      {/* Full width, so it reads across rather than down: who/how many on the
          left, the actual people on the right. A narrow column would have made
          this a list of two names under a heading, which is what the activity
          feed already is. */}
      <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-8">
        <div className="flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-success/10 text-success ring-1 ring-success/15">
              <UserRoundPlus className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">New student registrations</p>
              <p className="text-[13px] text-muted-foreground">Signed up on the portal — already in your pipeline</p>
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
                {isLoading ? "—" : thisWeek}
              </span>
              <span className="text-[13.5px] text-muted-foreground">in the last 7 days</span>
            </div>
            <Link
              to="/leads?stage=converted"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
            >
              See them in Leads <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-[62px] rounded-xl" />
              <Skeleton className="h-[62px] rounded-xl" />
              <Skeleton className="h-[62px] rounded-xl" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full items-center rounded-xl border border-dashed border-border px-5 py-6">
              <p className="text-[13.5px] text-muted-foreground">
                Nobody has registered on the portal yet. When they do, they appear here and on the Leads list the
                moment they finish signing up — and everyone on the lead desk gets a notification.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {items.slice(0, 6).map((lead) => {
                const name = `${lead.first_name} ${lead.last_name ?? ""}`.trim();
                const isNew = isWithinDays(lead.converted_at as string, 2);
                return (
                  <Link
                    key={lead.id}
                    to={`/leads/${lead.id}`}
                    className={cn(
                      "min-w-0 rounded-xl px-3.5 py-3 ring-1 ring-[var(--border)] transition-colors",
                      "hover:bg-black/[0.025] dark:hover:bg-white/[0.035]",
                      isNew && "bg-success/[0.04] ring-success/20",
                    )}
                  >
                    <p className="flex items-center gap-2 truncate text-[14.5px] font-medium text-foreground">
                      <span className="truncate">{name}</span>
                      {isNew && (
                        <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-success">
                          New
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{lead.email ?? lead.phone}</p>
                    <p className="mt-1 text-[12px] tabular-nums text-muted-foreground/80">
                      {formatRelativeTime(lead.converted_at as string)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
