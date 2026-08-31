import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListToolbar } from "@/components/shared/ListToolbar";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserPicker } from "@/components/shared/UserPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { OverallBadge, ReadinessBar } from "@/modules/eligibility/badges";
import { useEligibilityAssessments, useEligibilityStats } from "@/modules/eligibility/hooks";
import type { EligibilityAssessmentRead } from "@/modules/eligibility/types";
import { UserRole } from "@/types/enums";
import { formatDate } from "@/utils/format";

/**
 * The eligibility queue.
 *
 * Ordered around the one question a counsellor opens it to answer: *who should
 * I call next?* So the columns are the ones that decide that — what they want
 * to study, what the system made of them, how ready their paperwork is, who
 * owns it — and the default sort is newest first, because a lead that has just
 * arrived is the one most likely to answer the phone.
 */
export function EligibilityAssessmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [overall, setOverall] = useState("all");
  const [leadStatus, setLeadStatus] = useState("all");
  const [studyLevel, setStudyLevel] = useState("all");
  const [assignee, setAssignee] = useState<string | undefined>();
  const [sort, setSort] = useState("newest");
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useEligibilityAssessments({
    page,
    limit: 25,
    search: debounced || undefined,
    overall_status: overall === "all" ? undefined : overall,
    lead_status: leadStatus === "all" ? undefined : leadStatus,
    study_level: studyLevel === "all" ? undefined : studyLevel,
    assigned_to: assignee,
    sort,
  });
  const { data: stats } = useEligibilityStats();

  const columns = useMemo<ColumnDef<EligibilityAssessmentRead, unknown>[]>(
    () => [
      {
        id: "student",
        header: "Student",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.contact.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.contact.email ?? row.original.contact.phone}
            </p>
          </div>
        ),
      },
      {
        id: "course",
        header: "Course",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-[13px]">{row.original.preferred_course ?? "—"}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {row.original.study_level ?? ""}
            </p>
          </div>
        ),
      },
      {
        id: "english",
        header: "English",
        cell: ({ row }) => (
          <span className="text-[13px]">{row.original.english_summary ?? "—"}</span>
        ),
      },
      {
        id: "overall",
        header: "Assessment",
        cell: ({ row }) => <OverallBadge status={row.original.overall_status} />,
      },
      {
        id: "documents",
        header: "Documents",
        cell: ({ row }) => <ReadinessBar value={row.original.document_readiness} />,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.lead_status} />,
      },
      {
        id: "assignee",
        header: "Counsellor",
        cell: ({ row }) => (
          <span className={row.original.assigned_to_name ? "text-[13px]" : "text-xs text-muted-foreground"}>
            {row.original.assigned_to_name ?? "Unassigned"}
          </span>
        ),
      },
      {
        id: "submitted",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.original.submitted_at)}</span>
        ),
      },
      {
        id: "contacted",
        header: "Last contact",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.last_contacted_at ? formatDate(row.original.last_contacted_at) : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Eligibility assessments"
        description="Preliminary assessments submitted from the public site. Each one is a lead — open it to review the answers and start counselling."
      />

      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric label="Total" value={stats.total} />
          <Metric label="New" value={stats.new} />
          <Metric label="Likely eligible" value={stats.likely_eligible} />
          <Metric label="Needs review" value={stats.needs_review} />
          <Metric label="Unassigned" value={stats.unassigned} />
        </div>
      ) : null}

      <ListToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search name, email, phone or course…"
        filters={
          <>
            <Filter value={overall} onChange={setOverall} placeholder="Assessment" width={160}>
              <SelectItem value="all">All assessments</SelectItem>
              <SelectItem value="preliminary_likely_eligible">Likely eligible</SelectItem>
              <SelectItem value="needs_counsellor_review">Needs review</SelectItem>
              <SelectItem value="more_information_required">More info required</SelectItem>
            </Filter>

            <Filter value={leadStatus} onChange={setLeadStatus} placeholder="Status" width={140}>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </Filter>

            <Filter value={studyLevel} onChange={setStudyLevel} placeholder="Level" width={140}>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="foundation">Foundation</SelectItem>
              <SelectItem value="undergraduate">Undergraduate</SelectItem>
              <SelectItem value="postgraduate">Postgraduate</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </Filter>

            <div className="w-[180px]">
              <UserPicker
                value={assignee}
                onChange={(value) => {
                  setAssignee(value);
                  setPage(1);
                }}
                role={UserRole.COUNSELLOR}
                placeholder="Any counsellor"
              />
            </div>

            <Filter value={sort} onChange={setSort} placeholder="Sort" width={150}>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="status">By status</SelectItem>
              <SelectItem value="follow_up">By follow-up date</SelectItem>
            </Filter>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/eligibility/${row.id}`)}
        page={page}
        limit={25}
        total={data?.total}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            icon={ClipboardCheck}
            title="No assessments yet"
            description="Assessments submitted from the public eligibility check will appear here."
          />
        }
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function Filter({
  value,
  onChange,
  placeholder,
  width,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8" style={{ width }}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
