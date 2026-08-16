import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useActivityLogs } from "@/modules/activityLogs/hooks";
import { ActivityType, type ActivityLogRead } from "@/modules/activityLogs/types";
import { formatDateTime, initials, toTitleCase } from "@/utils/format";

const ACTIVITY_TONE: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  delete: "bg-danger/10 text-danger",
  login: "bg-muted text-muted-foreground",
  logout: "bg-muted text-muted-foreground",
  impersonate: "bg-warning/10 text-warning",
  status_change: "bg-info/10 text-info",
  assign: "bg-primary/10 text-primary",
  payment: "bg-success/10 text-success",
  upload: "bg-info/10 text-info",
  download: "bg-info/10 text-info",
  other: "bg-muted text-muted-foreground",
};

export function ActivityLogsPage() {
  const [activityType, setActivityType] = useState("all");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      limit: 25,
      activity_type: activityType === "all" ? undefined : (activityType as ActivityType),
    }),
    [page, activityType],
  );
  const { data, isLoading } = useActivityLogs(params);

  const columns = useMemo<ColumnDef<ActivityLogRead, any>[]>(
    () => [
      {
        accessorKey: "user_name",
        header: "User",
        cell: ({ row }) => {
          const name = row.original.user_name;
          if (!name) return <span className="text-muted-foreground">Unknown</span>;
          const [first, last] = name.split(" ");
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">{initials(first, last)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{row.original.user_email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "activity_type",
        header: "Action",
        cell: ({ getValue }) => {
          const type = getValue<string>();
          return (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACTIVITY_TONE[type] ?? ACTIVITY_TONE.other}`}>
              {toTitleCase(type)}
            </span>
          );
        },
      },
      { accessorKey: "description", header: "Details", cell: ({ getValue }) => <span className="text-foreground">{getValue<string>() ?? "—"}</span> },
      { accessorKey: "entity_type", header: "Entity", cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span> },
      { accessorKey: "ip_address", header: "IP address", cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span> },
      { accessorKey: "created_at", header: "When", cell: ({ getValue }) => <span className="text-muted-foreground">{formatDateTime(getValue<string>())}</span> },
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Activity Logs" description="A full audit trail of account, security, and access changes across the workspace." />

      <div className="mb-3">
        <ListToolbar
          filters={
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger size="sm" className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.values(ActivityType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {toTitleCase(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        page={page}
        limit={25}
        total={data?.total}
        onPageChange={setPage}
        emptyState={<EmptyState icon={ScrollText} title="No activity yet" description="Account and security actions will show up here." className="border-none py-20" />}
      />
    </div>
  );
}
