import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * "How many arrived this week, and who were the last few."
 *
 * The two things at the top of the console — students who registered on the
 * portal, and applications a student has handed over — are the same question
 * asked of two tables, so they are one card rendered twice rather than two
 * layouts that drift apart.
 *
 * ## The shape
 *
 * A count on the left, the three most recent on the right. The count is the
 * headline because "is this week busier than last" is the question a manager
 * opens the console with; the three names are there because the honest answer
 * to "is anything waiting on us" is a name and a timestamp, not a number.
 * Three, not six: this is a card that decides whether to click, not a list to
 * work from.
 *
 * ## The delta is real
 *
 * `previous` is the count for the seven days *before* the seven being shown,
 * computed from the same rows. It is not `syntheticSeries` — that function
 * fabricates a plausible-looking trend for the stat tiles because no history
 * endpoint exists, which is tolerable on a small tile and not tolerable on the
 * two biggest numbers on the page.
 *
 * When the previous window is empty the chip is **not rendered**. Going from
 * nought to nine is not "+900%", and a percentage against zero is the one
 * number that always looks impressive and never means anything.
 */

const TONES = {
  success: {
    icon: "bg-success/10 text-success ring-success/15",
    glow: "bg-success",
    avatar: "bg-success/10 text-success",
  },
  info: {
    icon: "bg-info/10 text-info ring-info/15",
    glow: "bg-info",
    avatar: "bg-info/10 text-info",
  },
} as const;

export interface ArrivalRow {
  id: string;
  /** Rendered as-is, so a caller can pass a component that resolves a name. */
  name: ReactNode;
  /** Two-letter monogram for the avatar. A node, so a caller can pass a
   * component that resolves it from an id. */
  monogram: ReactNode;
  /** Secondary line — an email, or the course applied for. */
  detail?: ReactNode;
  /** ISO timestamp; shown as "3 hours ago". */
  at: string | null | undefined;
  to: string;
}

export function ArrivalsCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  count,
  previous,
  unit = "in the last 7 days",
  rows,
  isLoading,
  emptyText,
  viewAllTo,
}: {
  icon: LucideIcon;
  tone: keyof typeof TONES;
  title: string;
  subtitle: string;
  count: number;
  previous: number;
  unit?: string;
  rows: ArrivalRow[];
  isLoading: boolean;
  emptyText: string;
  viewAllTo: string;
}) {
  const palette = TONES[tone];
  const delta = previous > 0 ? Math.round(((count - previous) / previous) * 100) : null;

  return (
    <section className="relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-card p-5 ring-1 ring-[var(--border)]">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full opacity-[0.10] blur-3xl",
          palette.glow,
        )}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
              palette.icon,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
            <p className="text-[12.5px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Link
          to={viewAllTo}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative z-10 mt-5 grid flex-1 gap-5 sm:grid-cols-[minmax(0,150px)_minmax(0,1fr)] sm:gap-6">
        <div>
          <p className="text-[42px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
            {isLoading ? "—" : count}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muted-foreground">{unit}</span>
            {!isLoading && delta !== null && (
              <span
                title="Compared with the seven days before"
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums",
                  delta >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
                )}
              >
                <ArrowUpRight className={cn("h-3 w-3", delta < 0 && "rotate-90")} />
                {delta >= 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0">
          {isLoading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-[38px] rounded-lg" />
              <Skeleton className="h-[38px] rounded-lg" />
              <Skeleton className="h-[38px] rounded-lg" />
            </div>
          ) : rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-[13px] leading-relaxed text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.slice(0, 3).map((row) => (
                <li key={row.id}>
                  <Link
                    to={row.to}
                    className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.035]"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold",
                        palette.avatar,
                      )}
                    >
                      {row.monogram}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-foreground">
                        {row.name}
                      </span>
                      {row.detail && (
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {row.detail}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-muted-foreground">
                      {formatRelativeTime(row.at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
