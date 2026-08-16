import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Contact2, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartments, useEmployeeDirectory } from "@/modules/people/hooks";
import type { EmployeeDirectoryEntry } from "@/modules/people/types";
import { API_BASE_URL } from "@/services/apiClient";
import { initials, toTitleCase } from "@/utils/format";

const EMPLOYMENT_STATUSES = ["active", "on_leave", "suspended", "terminated", "inactive"];
const LIMIT = 24;

function EmployeeCard({ employee, onClick }: { employee: EmployeeDirectoryEntry; onClick: () => void }) {
  const name = `${employee.first_name} ${employee.last_name}`.trim();
  const statusValue = employee.employment_status ?? employee.status;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex w-full items-start justify-between">
        <Avatar className="h-11 w-11 border border-border">
          {employee.avatar_url && (
            <AvatarImage src={employee.avatar_url.startsWith("http") ? employee.avatar_url : `${API_BASE_URL}${employee.avatar_url}`} alt="" />
          )}
          <AvatarFallback className="bg-primary/10 font-medium text-primary">{initials(employee.first_name, employee.last_name)}</AvatarFallback>
        </Avatar>
        <StatusBadge status={statusValue} />
      </div>

      <div className="min-w-0 w-full">
        <p className="truncate text-[13.5px] font-semibold text-foreground">{name || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{employee.designation || toTitleCase(employee.role)}</p>
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground/80">
          {employee.department_name ?? "No department"}
          {employee.employee_code && <> · {employee.employee_code}</>}
        </p>
      </div>
    </button>
  );
}

export function PeopleDirectoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useDepartments({ limit: 100 });

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      search: debouncedSearch || undefined,
      department_id: departmentId === "all" ? undefined : departmentId,
      employment_status: status === "all" ? undefined : status,
    }),
    [page, debouncedSearch, departmentId, status],
  );
  const { data, isLoading } = useEmployeeDirectory(params);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div>
      <PageHeader title="Directory" description="Every staff account, with department and employment details." />

      <div className="mb-4">
        <ListToolbar
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search staff…"
          filters={
            <>
              <Select
                value={departmentId}
                onValueChange={(value) => {
                  setDepartmentId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm" className="h-8 w-[170px] text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {(departments?.items ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm" className="h-8 w-[150px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {EMPLOYMENT_STATUSES.map((s) => (
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[112px] w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={search || departmentId !== "all" || status !== "all" ? Contact2 : Users}
          title={search || departmentId !== "all" || status !== "all" ? "No staff match your filters" : "No staff accounts yet"}
          description={
            search || departmentId !== "all" || status !== "all"
              ? "Try a different name, department, or status."
              : "Staff, counsellors, and admins will show up here."
          }
          className="border-none py-20"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} onClick={() => navigate(`/people/${employee.id}`)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} of {data.total} staff
              </p>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-[70px] text-center text-xs tabular-nums text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
