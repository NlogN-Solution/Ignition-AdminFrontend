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
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-lg bg-accent"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className="relative z-10 h-[15px] w-[15px] shrink-0" strokeWidth={2} />
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
            "relative z-10 ml-auto shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10",
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
        "flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[232px]",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
        </div>
        {!collapsed && <span className="truncate text-[13px] font-semibold tracking-tight">Ignition</span>}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-2 scrollbar-none">
        {pinnedItems.length > 0 && (
          <div>
            {!collapsed && <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">Pinned</p>}
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
              {!collapsed && <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</p>}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <SidebarLink key={item.path} {...item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2.5">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
