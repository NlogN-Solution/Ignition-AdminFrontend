import { Folder } from "lucide-react";
import { formatBytes, formatRelativeTime, initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { DocumentFolder } from "./types";

export function DocumentFolderCard({ folder, onClick }: { folder: DocumentFolder; onClick: () => void }) {
  const name = `${folder.first_name} ${folder.last_name}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Folder className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {folder.pending_count > 0 && (
          <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
            {folder.pending_count} pending
          </span>
        )}
      </div>

      <div className="min-w-0 w-full">
        <p className="truncate text-[13.5px] font-semibold text-foreground">{name || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {folder.document_count} document{folder.document_count === 1 ? "" : "s"} · {formatBytes(folder.total_size)}
        </p>
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground/80">Updated {formatRelativeTime(folder.last_updated)}</p>
      </div>
    </button>
  );
}

export function DocumentFolderRow({ folder, active, onClick }: { folder: DocumentFolder; active?: boolean; onClick: () => void }) {
  const name = `${folder.first_name} ${folder.last_name}`.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-medium",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {initials(folder.first_name, folder.last_name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{name || "—"}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{folder.document_count} docs</span>
      </span>
      {folder.pending_count > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />}
    </button>
  );
}
