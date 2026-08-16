import { Link, useNavigate } from "react-router";
import {
  Search,
  Plus,
  Bell,
  MessageCircle,
  CalendarClock,
  Sun,
  Moon,
  LogOut,
  Settings as SettingsIcon,
  UserPlus,
  CheckSquare,
  CalendarPlus,
  Wallet,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "./Breadcrumbs";
import { useUIStore } from "@/hooks/useUIStore";
import { useThemeStore } from "@/hooks/useTheme";
import { useAuthStore } from "@/services/authStore";
import { useLogout } from "@/hooks/useAuth";
import { useNotifications, useMarkNotificationRead } from "@/modules/notifications/hooks";
import { useMessageThreads } from "@/modules/messages/hooks";
import { useDueFollowUps } from "@/modules/leads/hooks";
import { initials, formatRelativeTime } from "@/utils/format";
import { EmptyState } from "./EmptyState";
import { NotificationType, UserRole } from "@/types/enums";
import { cn } from "@/lib/utils";

const NOTIFICATION_ROUTES: Partial<Record<NotificationType, string>> = {
  [NotificationType.DOCUMENT]: "/documents",
  [NotificationType.LEAD]: "/leads",
  [NotificationType.TASK]: "/tasks",
  [NotificationType.APPOINTMENT]: "/appointments",
  [NotificationType.PAYMENT]: "/payments",
  [NotificationType.APPLICATION]: "/applications",
};

export function Topbar() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  const { data } = useNotifications({ limit: 8 }, { refetchInterval: 30_000 });
  const markRead = useMarkNotificationRead();
  const unreadCount = data?.items.filter((n) => !n.is_read).length ?? 0;

  const { data: threads } = useMessageThreads({ refetchInterval: 30_000 });
  const unreadMessageCount = threads?.reduce((sum, t) => sum + t.unread_count, 0) ?? 0;

  const { data: dueFollowUps } = useDueFollowUps({ limit: 8 });
  const dueFollowUpCount = dueFollowUps?.items.filter((f) => new Date(f.scheduled_at) <= new Date()).length ?? 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-8 w-56 items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-3.5 w-3.5" />
          Search or jump to…
          <kbd className="ml-auto rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>

        {user?.role !== UserRole.STUDENT && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8 gap-1 pr-2.5">
                <Plus className="h-3.5 w-3.5" />
                Create
                <ChevronDown className="h-3 w-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => navigate("/leads?new=1")}>
                <UserPlus className="h-4 w-4" /> Add lead
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/tasks?new=1")}>
                <CheckSquare className="h-4 w-4" /> Create task
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/appointments?new=1")}>
                <CalendarPlus className="h-4 w-4" /> Book appointment
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/payments?new=1")}>
                <Wallet className="h-4 w-4" /> Record payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-medium">Notifications</span>
              <Link to="/notifications" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!data || data.items.length === 0 ? (
                <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show up here." className="border-none py-10" />
              ) : (
                data.items.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markRead.mutate(n.id);
                      const route = NOTIFICATION_ROUTES[n.type];
                      if (route) navigate(route);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-none hover:bg-muted/50",
                    )}
                  >
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-primary")} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {n.is_read && <Check className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/50" />}
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {user?.role !== UserRole.STUDENT && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <MessageCircle className="h-4 w-4" />
                {unreadMessageCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-medium text-white">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-medium">Messages</span>
                <Link to="/communication" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!threads || threads.length === 0 ? (
                  <EmptyState icon={MessageCircle} title="No conversations yet" description="Student messages will show up here." className="border-none py-10" />
                ) : (
                  threads.slice(0, 8).map((thread) => (
                    <button
                      type="button"
                      key={thread.student_id}
                      onClick={() => navigate("/communication")}
                      className="flex w-full items-start gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-none hover:bg-muted/50"
                    >
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", thread.unread_count > 0 ? "bg-primary" : "bg-transparent")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{thread.student_name}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {thread.last_message_from_student ? "" : "You: "}
                          {thread.last_message}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(thread.last_message_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {user?.role !== UserRole.STUDENT && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <CalendarClock className="h-4 w-4" />
                {dueFollowUpCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-medium text-white">
                    {dueFollowUpCount > 9 ? "9+" : dueFollowUpCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-sm font-medium">Follow-ups</span>
                <Link to="/leads" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!dueFollowUps || dueFollowUps.items.length === 0 ? (
                  <EmptyState icon={CalendarClock} title="Nothing due" description="Upcoming follow-ups will show up here." className="border-none py-10" />
                ) : (
                  dueFollowUps.items.map((followUp) => (
                    <button
                      type="button"
                      key={followUp.id}
                      onClick={() => navigate(`/leads/${followUp.lead_id}`)}
                      className="flex w-full items-start gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-none hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          new Date(followUp.scheduled_at) <= new Date() ? "bg-danger" : "bg-primary",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{followUp.lead_name}</p>
                        <p className="text-xs text-muted-foreground">Attempt {followUp.attempt_number} · {followUp.method}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatRelativeTime(followUp.scheduled_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPreference(preference === "dark" ? "light" : "dark")}
        >
          {preference === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 rounded-full">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-[12px] font-medium text-primary">
                  {initials(user?.first_name, user?.last_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              <SettingsIcon className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => logout.mutate()} className="text-danger focus:text-danger">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
