import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useCurrentUser, useUnauthorizedListener } from "@/hooks/useAuth";
import { useThemeEffect } from "@/hooks/useTheme";

export function AppShell() {
  const location = useLocation();
  useThemeEffect();
  useUnauthorizedListener();
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="mx-auto max-w-[1400px] px-6 py-5"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
