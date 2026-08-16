import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, MoreHorizontal, Plus, RotateCcw, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { useDeleteUser, useRestoreUser, useUsers } from "@/modules/users/hooks";
import { UserFormSheet } from "@/modules/users/UserFormSheet";
import { CreateUserDialog } from "@/modules/users/CreateUserDialog";
import { ResetPasswordDialog } from "@/modules/users/ResetPasswordDialog";
import type { UserRead } from "@/modules/users/types";
import { canManageTarget } from "@/constants/permissions";
import { useAuthStore } from "@/services/authStore";
import { UserRole, UserStatus } from "@/types/enums";
import { initials, toTitleCase } from "@/utils/format";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const [editUser, setEditUser] = useState<UserRead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRead | null>(null);
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();
  const actingRole = useAuthStore((s) => s.user?.role);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      role: role === "all" ? undefined : (role as UserRole),
      status: status === "all" ? undefined : (status as UserStatus),
    }),
    [page, debouncedSearch, role, status],
  );
  const { data, isLoading } = useUsers(params);

  const columns = useMemo<ColumnDef<UserRead, any>[]>(
    () => [
      {
        accessorKey: "first_name",
        header: "Name",
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
      { accessorKey: "role", header: "Role", cell: ({ getValue }) => <span className="text-muted-foreground">{toTitleCase(getValue<string>())}</span> },
      { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
      { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => getValue<string>() || "—" },
      {
        id: "actions",
        header: "",
        size: 48,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setEditUser(row.original)}>
                <UserCog className="h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              {canManageTarget(actingRole, row.original.role) && (
                <DropdownMenuItem onSelect={() => setResetPasswordUser(row.original)}>
                  <KeyRound className="h-3.5 w-3.5" /> Reset password
                </DropdownMenuItem>
              )}
              {row.original.status === UserStatus.SUSPENDED ? (
                <DropdownMenuItem onSelect={() => restoreUser.mutate(row.original.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </DropdownMenuItem>
              ) : (
                canManageTarget(actingRole, row.original.role) && (
                  <DropdownMenuItem
                    className="text-danger focus:text-danger"
                    onSelect={() => {
                      if (confirm(`Deactivate ${row.original.first_name} ${row.original.last_name}?`)) deleteUser.mutate(row.original.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Deactivate
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [deleteUser, restoreUser, actingRole],
  );

  return (
    <div>
      <PageHeader
        title="Users & Staff"
        description="Everyone with access to this workspace."
        actions={
          actingRole === UserRole.ADMIN || actingRole === UserRole.SUPER_ADMIN ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Create user
            </Button>
          ) : undefined
        }
      />

      <div className="mb-3">
        <ListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, or phone…"
          filters={
            <>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {Object.values(UserRole).map((r) => (
                    <SelectItem key={r} value={r}>
                      {toTitleCase(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger size="sm" className="h-8 w-[130px] text-xs">
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
            </>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        page={page}
        limit={20}
        total={data?.total}
        onPageChange={setPage}
        emptyState={<EmptyState icon={ShieldCheck} title="No users found" description="Try a different search or filter." className="border-none py-20" />}
      />

      <UserFormSheet user={editUser} open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)} />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog user={resetPasswordUser} open={Boolean(resetPasswordUser)} onOpenChange={(open) => !open && setResetPasswordUser(null)} />
    </div>
  );
}
