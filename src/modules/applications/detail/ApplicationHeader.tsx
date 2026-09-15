import { ArrowLeft, Building2, ChevronDown, Copy, Pencil, RefreshCw, Trash2, User, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApplicationStatus } from "@/types/enums";
import { formatDateTime } from "@/utils/format";

/**
 * The one band of the page that answers "who, what, where are we" at a glance.
 *
 * The applicant leads. They were a 13.5px muted line sitting between the
 * university and the application id, the same size and colour as both — so the
 * first question a staff member actually has ("whose file is this?") was
 * answered in the smallest type on the page. The name is now the largest thing
 * under the title, with an avatar, and the university and reference have
 * dropped to the supporting line where they belong.
 *
 * Everything here is a fact about the application, not a control — except the
 * status badge and the Actions menu, which are the two things a staff member
 * reaches for first. The destructive delete used to sit as a bare red trash
 * icon beside "Change status", one mis-click from the thing it does; it is now
 * the last item of the Actions menu, behind a separator, and still confirmed.
 */

interface ApplicationHeaderProps {
  programName: string;
  universityName: string | null;
  applicantName: React.ReactNode;
  /** Initials for the avatar when there is no image. Falls back to a glyph. */
  applicantInitials: string | null;
  applicantAvatarUrl: string | null;
  applicationRef: string;
  status: ApplicationStatus;
  updatedAt: string;
  canManage: boolean;
  canDelete: boolean;
  onBack: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
  onAssignAdvisor: () => void;
  onCopyRef: () => void;
  onDelete: () => void;
}

export function ApplicationHeader({
  programName,
  universityName,
  applicantName,
  applicantInitials,
  applicantAvatarUrl,
  applicationRef,
  status,
  updatedAt,
  canManage,
  canDelete,
  onBack,
  onEdit,
  onChangeStatus,
  onAssignAdvisor,
  onCopyRef,
  onDelete,
}: ApplicationHeaderProps) {
  return (
    <header>
      <Button variant="ghost" size="sm" className="-ml-2 mb-1 gap-1.5 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applications
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,2.1vw,1.85rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground">
            {programName}
          </h1>

          {/* The applicant, given the weight the question deserves. */}
          <dl className="mt-2">
            <dt className="sr-only">Applicant</dt>
            <dd className="flex min-w-0 items-center gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                {applicantAvatarUrl && <AvatarImage src={applicantAvatarUrl} alt="" />}
                <AvatarFallback className="bg-primary/10 text-[12px] font-semibold text-primary">
                  {applicantInitials ?? <User className="h-4 w-4" aria-hidden />}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-[20px] font-semibold tracking-[-0.015em] text-foreground">
                {applicantName}
              </span>
            </dd>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <dt className="sr-only">University</dt>
                <dd className="truncate text-muted-foreground">{universityName ?? "—"}</dd>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <dt className="text-muted-foreground/70">Application ID</dt>
                <dd className="truncate font-mono text-[12.5px] text-muted-foreground">{applicationRef}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} className="px-2.5 py-1 text-[13px]" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Actions
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={onEdit} disabled={!canManage}>
                  <Pencil className="h-3.5 w-3.5" /> Edit application
                </DropdownMenuItem>

                {/*
                  A plain item opening a dialog, not a submenu.

                  This was a `DropdownMenuSub` listing all fourteen statuses.
                  The submenu opened and the items rendered, but selecting one
                  did nothing at all — no request, no toast — because Radix's
                  nested SubContent never dispatched `onSelect` here. Rather
                  than chase that, it now opens `ChangeStatusDialog`, which was
                  already built for the removed Quick Actions card: one status
                  flow instead of two, and it carries the optional reason that a
                  submenu of bare labels could never collect.
                */}
                <DropdownMenuItem onSelect={onChangeStatus} disabled={!canManage}>
                  <RefreshCw className="h-3.5 w-3.5" /> Change status…
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={onAssignAdvisor} disabled={!canManage}>
                  <UserPlus className="h-3.5 w-3.5" /> Assign advisor
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={onCopyRef}>
                  <Copy className="h-3.5 w-3.5" /> Copy application ID
                </DropdownMenuItem>

                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                      Irreversible
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={onDelete}
                      className="text-danger focus:bg-danger/10 focus:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete application
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-[12.5px] text-muted-foreground">Updated {formatDateTime(updatedAt)}</p>
        </div>
      </div>
    </header>
  );
}
