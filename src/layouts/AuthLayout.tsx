import { Outlet } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import ignitionMark from "@/assets/ignition-mark.png";
import { APPLICATION_PHASES } from "@/modules/applications/lifecycle";

/**
 * The way in.
 *
 * It used to be a small glass card alone in the middle of the field — correct,
 * and indistinguishable from any other console. The screen now says what this
 * console is for, in the only vocabulary that is actually ours: the seven
 * phases an application moves through. `APPLICATION_PHASES` is imported rather
 * than retyped, so the journey printed on the door is the journey the product
 * behind it runs on.
 *
 * Two columns from `lg`: the journey on the left, the form on the right, with
 * the ambient field already behind everything (see `index.css`) doing the work
 * a decorative gradient would otherwise be hired for. Below `lg` the panel goes
 * — someone signing in on a phone wants the form, not the prospectus.
 */
export function AuthLayout() {
  const reduce = useReducedMotion();

  // One orchestrated entrance, on load, and nothing after it.
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.32, 0.72, 0, 1] as const },
        };

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="mx-auto grid min-h-svh max-w-6xl items-center gap-16 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20 lg:px-10">
        {/* ── The journey ─────────────────────────────────────────────── */}
        <div className="hidden lg:block">
          <motion.div {...rise(0)} className="flex items-center gap-2.5">
            <img src={ignitionMark} alt="" aria-hidden className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-semibold tracking-[-0.022em]">Ignition</span>
          </motion.div>

          <motion.h1
            {...rise(0.06)}
            className="mt-10 max-w-[13ch] text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground"
          >
            Every application, from first enquiry to enrolment.
          </motion.h1>

          <motion.p {...rise(0.12)} className="mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-muted-foreground">
            Leads, offers, CAS and visas for every student you advise — one file each, and the
            whole journey on it.
          </motion.p>

          {/* A real sequence, so it is drawn as one: one unbroken line, and a
              stop on it for each phase. No numbers — the phases have names, and
              the names are what staff say out loud.

              The line is a single element spanning first dot to last, rather
              than a segment per item: segments leave hairline gaps at every
              join, and at this weight a gap is the difference between a
              journey and a bullet list. */}
          <ol className="relative mt-12">
            <motion.span
              {...rise(0.18)}
              aria-hidden
              className="absolute left-[3.5px] top-[10px] bottom-[10px] w-px bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--foreground)_22%,transparent)_12%,color-mix(in_srgb,var(--foreground)_22%,transparent)_88%,transparent)]"
            />
            {APPLICATION_PHASES.map((phase, index) => (
              <motion.li
                key={phase}
                {...rise(0.2 + index * 0.05)}
                className="relative flex items-center gap-3.5 pb-5 last:pb-0"
              >
                <span
                  aria-hidden
                  className="relative z-10 h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-background"
                />
                <span className="text-[13.5px] font-medium tracking-[-0.01em] text-muted-foreground">
                  {phase}
                </span>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* ── The form ────────────────────────────────────────────────── */}
        <div className="w-full">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src={ignitionMark} alt="" aria-hidden className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-semibold tracking-[-0.022em]">Ignition</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
