import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  Loader2,
  Mail,
  Phone,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserPicker } from "@/components/shared/UserPicker";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApplicationFormDialog } from "@/modules/applications/ApplicationFormDialog";
import { IndicatorRow, OverallBadge, ReadinessBar } from "@/modules/eligibility/badges";
import { useEligibilityAssessment } from "@/modules/eligibility/hooks";
import {
  DOCUMENT_ITEMS,
  DOCUMENT_LABELS,
  ENGLISH_LABELS,
  FUNDING_LABELS,
  QUALIFICATION_LABELS,
} from "@/modules/eligibility/types";
import { LeadFollowUpTimeline } from "@/modules/leads/LeadFollowUpTimeline";
import { useAssignLead, useChangeLeadStatus, useLead, useUpdateLead } from "@/modules/leads/hooks";
import { useAuthStore } from "@/services/authStore";
import { LeadStatus, UserRole } from "@/types/enums";
import { formatDate, formatDateTime } from "@/utils/format";

/**
 * One assessment, and everything needed to act on it.
 *
 * Built to answer, in order and without leaving the page: who is this, what do
 * they want to study, what have they got, what did the system make of it, and
 * what do I do next. A counsellor who has to open three tabs to prepare for a
 * phone call will not prepare for the phone call.
 *
 * **The submission is read-only; the lead is not.** Everything in the action
 * bar — status, assignment, notes, follow-ups — writes to the lead through the
 * existing lead hooks, which log to the lead's own timeline exactly as they do
 * from the leads screen. Nothing here is a second CRM.
 *
 * The system's verdict and the counsellor's decision are kept visibly apart.
 * The panel says what the rules said and which version said it; what happens
 * to the student is the status the counsellor sets, and the two are never
 * merged into one field.
 */
export function EligibilityDetailPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);

  const { data: assessment, isLoading } = useEligibilityAssessment(assessmentId);
  const leadId = assessment?.lead_id ?? "";
  const { data: lead } = useLead(leadId || undefined);

  const changeStatus = useChangeLeadStatus(leadId);
  const assignLead = useAssignLead(leadId);
  const updateLead = useUpdateLead(leadId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState<string | undefined>();
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (lead) setNotes(lead.remarks ?? "");
  }, [lead]);

  // The assessment carries a user_id only when the person already had an account
  // when they submitted; otherwise the account appears when the lead is converted.
  const applicationStudentId = assessment?.user_id ?? lead?.converted_user_id ?? undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Assessment not found"
        description="It may have been deleted along with its lead."
      />
    );
  }

  const { contact, education, english, finance, documents } = assessment;
  const canManage =
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.COUNSELLOR;

  // `phoneDigits` is gone with the WhatsApp button it built a wa.me link for.
  // `tel:` does its own stripping below.
  const readiness = assessment.document_readiness;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
        onClick={() => navigate("/eligibility")}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to assessments
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
              {contact.full_name}
            </h1>
            {lead ? <StatusBadge status={lead.status} /> : null}
            <OverallBadge status={assessment.overall_status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {assessment.preferred_course ?? "Course not specified"}
            {assessment.study_level ? ` · ${assessment.study_level}` : ""} · Submitted{" "}
            {formatDateTime(assessment.submitted_at)}
          </p>
        </div>

        {/* Contact actions first: the point of the page is the phone call. */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${contact.phone}`}>
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          </Button>
          {/* The WhatsApp button that was here is gone. An enquiry answered on
              WhatsApp leaves no record the application can search, show the
              student, or keep after the counsellor moves on — and this is a
              page about somebody who has not got an account yet, so the thread
              store (which handles exactly that: threads against a lead) is
              where the conversation belongs. Call and email remain because
              both are how this page is actually worked. */}
          {contact.email ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            </Button>
          ) : null}

          {canManage && lead ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Change status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[
                    LeadStatus.NEW,
                    LeadStatus.CONTACTED,
                    LeadStatus.FOLLOW_UP,
                    LeadStatus.QUALIFIED,
                  ].map((status) => (
                    <DropdownMenuItem
                      key={status}
                      disabled={lead.status === status || changeStatus.isPending}
                      onClick={() => changeStatus.mutate({ status })}
                    >
                      {status.replace("_", " ")}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAssignee(lead.assigned_to ?? undefined);
                  setAssignOpen(true);
                }}
              >
                <UserCog className="h-3.5 w-3.5" />
                {assessment.assigned_to_name ?? "Assign"}
              </Button>

              {/* Deliberately not automatic. An assessment is not an
                  application — a counsellor decides the student is ready and
                  starts one, against the real catalogue.

                  It needs a student account to file against, which only exists
                  once the lead has been converted. Without one the form opened
                  with an empty, locked applicant field and could not be
                  submitted, so the button says why instead. */}
              <Button
                size="sm"
                disabled={!applicationStudentId}
                title={applicationStudentId ? undefined : "Convert this lead to a client first"}
                onClick={() => setApplicationOpen(true)}
              >
                Start application
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Tabs defaultValue="answers">
            <TabsList>
              <TabsTrigger value="answers">Answers</TabsTrigger>
              <TabsTrigger value="notes">Internal notes</TabsTrigger>
              <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
            </TabsList>

            <TabsContent value="answers" className="mt-4 space-y-4">
              <Panel title="Profile">
                <Row label="Full name" value={contact.full_name} />
                <Row label="Email" value={contact.email} />
                <Row label="Phone" value={contact.phone} />
                <Row label="Country" value={contact.country} />
                <Row label="Preferred contact" value={contact.preferred_contact_method} />
                <Row
                  label="Consent given"
                  value={assessment.consent_at ? formatDateTime(assessment.consent_at) : "Not recorded"}
                />
              </Panel>

              <Panel title="Education">
                <Row
                  label="Highest qualification"
                  value={QUALIFICATION_LABELS[String(education.highest_qualification)] ?? null}
                />
                <Row label="Subject" value={education.subject as string} />
                <Row label="Institution" value={education.institution as string} />
                <Row label="Grade / GPA" value={education.grade as string} />
                <Row label="Year completed" value={education.completion_year as number} />
              </Panel>

              <Panel title="English">
                <Row label="Evidence" value={ENGLISH_LABELS[String(english.evidence)] ?? null} />
                {english.other_test_name ? (
                  <Row label="Test name" value={english.other_test_name as string} />
                ) : null}
                <Row label="Overall score" value={english.overall_score as number} />
                {(["listening", "reading", "writing", "speaking"] as const).some(
                  (band) => english[band] != null,
                ) ? (
                  <Row
                    label="Bands"
                    value={(["listening", "reading", "writing", "speaking"] as const)
                      .filter((band) => english[band] != null)
                      .map((band) => `${band[0].toUpperCase()}${english[band]}`)
                      .join(" · ")}
                  />
                ) : null}
              </Panel>

              <Panel title="Course preferences">
                <Row label="Study level" value={assessment.study_level} />
                <Row label="Course" value={assessment.preferred_course} />
                <Row label="Location" value={assessment.preferred_location ?? "Anywhere in the UK"} />
                <Row
                  label="Universities"
                  value={
                    assessment.preferred_universities.length
                      ? assessment.preferred_universities.map((entry) => entry.name).join(", ")
                      : null
                  }
                />
              </Panel>

              <Panel title="Financial readiness">
                <Row
                  label="Funding source"
                  value={FUNDING_LABELS[String(finance.funding_source)] ?? null}
                />
                <Row label="Estimated funds" value={finance.estimated_funds as number} />
                <Row label="Sponsor" value={finance.sponsor_relationship as string} />
                <Row label="Loan amount" value={finance.loan_amount as number} />
                <Row label="Scholarship" value={finance.scholarship_amount as number} />
                <Row label="Notes" value={finance.notes as string} />
              </Panel>

              <Panel title="Document readiness">
                {DOCUMENT_ITEMS.map((item) => (
                  <Row
                    key={item.key}
                    label={item.label}
                    value={DOCUMENT_LABELS[String(documents[item.key])] ?? null}
                  />
                ))}
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2.5">
                  <span className="text-xs font-medium text-foreground">Readiness</span>
                  <ReadinessBar value={readiness} />
                </div>
              </Panel>

              {assessment.message ? (
                <Panel title="What the student told us">
                  <p className="py-1 text-[13px] leading-relaxed text-foreground">
                    {assessment.message}
                  </p>
                </Panel>
              ) : null}
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-[13px] font-semibold text-foreground">Internal notes</h2>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                  Staff only — the student never sees these. Saved against the lead, so they travel
                  with it into the application.
                </p>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={8}
                  placeholder="Interested in MSc Computer Science. IELTS 6.5. Needs financial document clarification. Call tomorrow."
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    disabled={!lead || notes === (lead.remarks ?? "") || updateLead.isPending}
                    onClick={() => updateLead.mutate({ remarks: notes })}
                  >
                    {updateLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save notes
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="follow-ups" className="mt-4">
              {lead ? (
                <LeadFollowUpTimeline leadId={lead.id} leadStatus={lead.status} />
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-[13px] font-semibold text-foreground">System preliminary assessment</h2>
            <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
              Computed from the student&rsquo;s answers by ruleset {assessment.assessment_version}.
              Nothing here is verified — it is a starting point, not a decision.
            </p>

            <div className="divide-y divide-border">
              <IndicatorRow label="Academic" status={assessment.academic_status} />
              <IndicatorRow label="English" status={assessment.english_status} />
              <IndicatorRow label="Financial" status={assessment.financial_status} />
              <IndicatorRow label="Documents" status={assessment.document_status} />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Overall</span>
              <OverallBadge status={assessment.overall_status} />
            </div>

            {assessment.assessment_notes.length ? (
              <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                {assessment.assessment_notes.map((note) => (
                  <li key={note} className="text-xs leading-relaxed text-muted-foreground">
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-[13px] font-semibold text-foreground">Counsellor decision</h2>
            <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
              The system routes; you decide. Status and ownership below are what the business acts
              on.
            </p>
            <Row label="Status" value={lead ? lead.status.replace("_", " ") : null} />
            <Row label="Assigned to" value={assessment.assigned_to_name ?? "Unassigned"} />
            <Row
              label="Last contacted"
              value={assessment.last_contacted_at ? formatDate(assessment.last_contacted_at) : "Never"}
            />
            <Row
              label="Next follow-up"
              value={
                assessment.next_follow_up_at ? formatDate(assessment.next_follow_up_at) : "None set"
              }
            />
            {lead ? (
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to={`/leads/${lead.id}`}>
                  <FileText className="h-3.5 w-3.5" /> Open full lead record
                </Link>
              </Button>
            ) : null}
          </section>

          {assessment.source_page ? (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-[13px] font-semibold text-foreground">Source</h2>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{assessment.source_page}</p>
              {assessment.user_id ? (
                <Badge variant="secondary" className="mt-2">
                  Submitted while signed in
                </Badge>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign counsellor</DialogTitle>
          </DialogHeader>
          <UserPicker
            value={assignee}
            onChange={setAssignee}
            role={UserRole.COUNSELLOR}
            placeholder="Select a counsellor…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!assignee || assignLead.isPending}
              onClick={() =>
                assignee &&
                assignLead.mutate(assignee, { onSuccess: () => setAssignOpen(false) })
              }
            >
              {assignLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplicationFormDialog
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
        defaultStudentId={applicationStudentId}
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-2 text-[13px] font-semibold text-foreground">{title}</h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={empty ? "text-[13px] text-muted-foreground" : "text-[13px] font-medium capitalize text-foreground"}>
        {empty ? "—" : value}
      </dd>
    </div>
  );
}
