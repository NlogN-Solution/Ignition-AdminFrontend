import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useCurrentUser, useUnauthorizedListener } from "@/hooks/useAuth";
import { useThemeEffect } from "@/hooks/useTheme";

/**
 * The shell is inset from the window on every side, so the sidebar reads as a
 * panel resting on the canvas rather than a column bolted to the edge. The top
 * bar lives *inside* the scroll container: content passes under it and is
 * blurred by it, which is the whole reason it is made of glass.
 */
export function AppShell() {
  const location = useLocation();
  useThemeEffect();
  useUnauthorizedListener();
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-svh gap-3 overflow-hidden p-3">
      <Sidebar />

      <main className="relative min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[calc(var(--radius)*1.7)]">
        <Topbar />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className="mx-auto max-w-[1360px] px-5 pt-7 pb-24 sm:px-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <CommandPalette />
    </div>
  );
}
