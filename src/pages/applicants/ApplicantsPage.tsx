import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { GraduationCap, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useUsers } from "@/modules/users/hooks";
import type { UserRead } from "@/modules/users/types";
import { UserRole, UserStatus } from "@/types/enums";
import { initials, toTitleCase } from "@/utils/format";
import { LeadFormDialog } from "@/modules/leads/LeadFormDialog";

export function ApplicantsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      role: UserRole.STUDENT,
      status: status === "all" ? undefined : (status as UserStatus),
    }),
    [page, debouncedSearch, status],
  );
  const { data, isLoading } = useUsers(params);

  const columns = useMemo<ColumnDef<UserRead, any>[]>(
    () => [
      {
        accessorKey: "first_name",
        header: "Applicant",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                {initials(row.original.first_name, row.original.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {row.original.first_name} {row.original.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => getValue<string>() || "—" },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Applicants"
        description="Students moving through your admissions pipeline."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add lead
          </Button>
        }
      />

      <div className="mb-3">
        <ListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, or phone…"
          filters={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.values(UserStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {toTitleCase(s)}
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
        onRowClick={(row) => navigate(`/applicants/${row.id}`)}
        page={page}
        limit={20}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={GraduationCap}
            title="No applicants yet"
            description="Applicants appear here once a lead converts, or once someone registers as a student."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add a lead to convert
              </Button>
            }
            className="border-none py-20"
          />
        }
      />

      <LeadFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
