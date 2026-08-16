import { useMemo, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMarkNotificationRead, useMarkNotificationUnread, useNotifications } from "@/modules/notifications/hooks";
import { NotificationType } from "@/types/enums";
import { formatDateTime, toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const [type, setType] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      notification_type: type === "all" ? undefined : (type as NotificationType),
      is_read: readFilter === "all" ? undefined : readFilter === "read",
    }),
    [page, type, readFilter],
  );
  const { data, isLoading } = useNotifications(params);
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();

  return (
    <div>
      <PageHeader title="Notifications" description="Everything that needs your attention, in one place." />

      <div className="mb-3">
        <ListToolbar
          filters={
            <>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger size="sm" className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.values(NotificationType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger size="sm" className="h-8 w-[120px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-border p-4 last:border-none">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show up here." className="border-none py-20" />
        ) : (
          data.items.map((n) => (
            <div
              key={n.id}
              className={cn("flex items-start gap-3 border-b border-border p-4 transition-colors last:border-none hover:bg-muted/30", !n.is_read && "bg-primary/[0.02]")}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">{toTitleCase(n.type)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">{formatDateTime(n.created_at)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1 text-xs text-muted-foreground"
                onClick={() => (n.is_read ? markUnread.mutate(n.id) : markRead.mutate(n.id))}
              >
                {n.is_read ? (
                  <>
                    <Check className="h-3 w-3" /> Mark unread
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-3 w-3" /> Mark read
                  </>
                )}
              </Button>
            </div>
          ))
        )}
      </div>

      {data && data.total > 0 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(data.total / 20))}</span>
          <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
