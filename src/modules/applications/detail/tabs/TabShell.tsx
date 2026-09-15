import type { ReactNode } from "react";

/**
 * The frame every tab panel sits in, so six sections written at six different
 * times cannot end up with six different heading sizes and paddings.
 */
export function TabShell({
  title,
  description,
  actions,
  children,
  bare = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Skip the card chrome, for a panel whose content brings its own cards. */
  bare?: boolean;
}) {
  return (
    <section className={bare ? "" : "rounded-2xl bg-card ring-1 ring-[var(--border)]"}>
      <header
        className={
          bare
            ? "mb-4 flex flex-wrap items-end justify-between gap-3"
            : "flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6"
        }
      >
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">{title}</h2>
          {description && <p className="mt-0.5 max-w-[70ch] text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className={bare ? "" : "px-5 py-5 sm:px-6"}>{children}</div>
    </section>
  );
}
