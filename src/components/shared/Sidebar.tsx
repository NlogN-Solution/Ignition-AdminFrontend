import { NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import { ChevronsLeft, ChevronsRight, Pin, Zap } from "lucide-react";
import { NAV_GROUPS, ALL_NAV_ITEMS } from "@/constants/navigation";
import { canAccessModule } from "@/constants/permissions";
import { useAuthStore } from "@/services/authStore";
import { useUIStore } from "@/hooks/useUIStore";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function SidebarLink({ path, label, icon: Icon, collapsed }: { path: string; label: string; icon: React.ElementType; collapsed: boolean }) {
  const location = useLocation();
  const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const togglePinned = useUIStore((s) => s.togglePinned);
  const isPinned = useUIStore((s) => s.pinnedPaths.includes(path));

  const link = (
    <NavLink
      to={path}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13px] transition-colors duration-200",
        isActive ? "font-medium text-foreground" : "font-normal text-muted-foreground hover:text-foreground",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="glass-lozenge absolute inset-0 rounded-[10px]"
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
        />
      )}
      <Icon
        className={cn("relative z-10 h-[15px] w-[15px] shrink-0 transition-colors", isActive && "text-primary")}
        strokeWidth={isActive ? 2.1 : 1.9}
      />
      {!collapsed && <span className="relative z-10 truncate">{label}</span>}
      {!collapsed && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePinned(path);
          }}
          className={cn(
            "relative z-10 ml-auto shrink-0 rounded-md p-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10",
            isPinned && "opacity-100",
          )}
        >
          <Pin className={cn("h-3 w-3", isPinned ? "fill-current" : "")} />
        </button>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const pinnedPaths = useUIStore((s) => s.pinnedPaths);

  const pinnedItems = ALL_NAV_ITEMS.filter((item) => pinnedPaths.includes(item.path));

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden rounded-[calc(var(--radius)*1.7)] bg-sidebar shadow-[var(--shadow-2)] ring-1 ring-inset ring-[var(--sidebar-border)]",
        "transition-[width] duration-300 ease-[var(--ease-swift)]",
        collapsed ? "w-[72px]" : "w-[236px]",
      )}
    >
      <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-foreground shadow-[var(--shadow-1),var(--glass-sheen)]">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
        {!collapsed && <span className="truncate text-[14px] font-semibold tracking-[-0.02em]">Ignition</span>}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2.5 pt-3 pb-4 scrollbar-none">
        {pinnedItems.length > 0 && (
          <div>
            {!collapsed && <p className="label-micro px-2.5 pb-2 text-muted-foreground/60">Pinned</p>}
            <div className="space-y-0.5">
              {pinnedItems.map((item) => (
                <SidebarLink key={item.path} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        )}

        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) =>
            canAccessModule(role, item.module),
          );
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && <p className="label-micro px-2.5 pb-2 text-muted-foreground/60">{group.label}</p>}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <SidebarLink key={item.path} {...item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* The nav scrolls under this, so it needs its own ground to sit on. */}
      <div className="border-t border-[var(--sidebar-border)] p-2 pt-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] py-2 text-muted-foreground transition-colors duration-200 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
