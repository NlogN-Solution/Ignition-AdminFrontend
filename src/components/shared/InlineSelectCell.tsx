import type { ReactNode } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * A table cell you can change without leaving the table.
 *
 * ## Why
 *
 * Re-prioritising a lead, moving one along its lifecycle or handing it to
 * somebody else meant opening the record, finding the control, saving, and
 * navigating back — once per lead, down a list of forty. The detail page's
 * edit dialog did not even carry status, so the commonest change of all was
 * only reachable from a dropdown in the page header.
 *
 * ## The shape
 *
 * It reads as text until you want it to be a control: no border, no chevron,
 * nothing that makes forty rows look like forty form fields. Hover or focus
 * reveals the affordance. That keeps a dense table scannable — the table's job
 * most of the time — while making every one of those values one click from
 * editable.
 *
 * `stopPropagation` on the trigger because these tables navigate on row click.
 * Without it, changing a value would also open the record you were trying not
 * to have to open.
 *
 * Options may be disabled with a reason. That is for values the API will
 * refuse — an application status that needs a date and a document cannot be
 * set from a list row — so the row says why instead of offering a control that
 * produces a 400.
 */

export interface InlineOption<T extends string> {
  value: T;
  label: string;
  /** Rendered instead of the plain label when present — a badge, say. */
  display?: ReactNode;
  /** Set to explain why this option cannot be picked here. */
  disabledReason?: string;
}

export function InlineSelectCell<T extends string>({
  value,
  options,
  onChange,
  disabled,
  isSaving,
  label,
  align = "start",
  children,
}: {
  value: T | null;
  options: InlineOption<T>[];
  onChange: (next: T) => void;
  /** No permission to edit: renders the value as plain text. */
  disabled?: boolean;
  isSaving?: boolean;
  /** Heading above the menu, e.g. "Set priority". */
  label: string;
  align?: "start" | "end";
  /** What the cell shows when closed. Defaults to the selected option's label. */
  children?: ReactNode;
}) {
  const selected = options.find((o) => o.value === value);
  const shown = children ?? selected?.display ?? selected?.label ?? (
    <span className="text-muted-foreground">—</span>
  );

  if (disabled) return <>{shown}</>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          title={label}
          className={cn(
            "group/inline -mx-1.5 flex w-[calc(100%+0.75rem)] min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-left",
            "transition-colors hover:bg-black/[0.045] dark:hover:bg-white/[0.07]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{shown}</span>
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown
              aria-hidden
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/inline:opacity-100 group-focus-visible/inline:opacity-100"
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="max-h-80 w-60 overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={Boolean(option.disabledReason)}
            title={option.disabledReason}
            onSelect={() => {
              if (option.disabledReason || option.value === value) return;
              onChange(option.value);
            }}
            className="gap-2"
          >
            <Check
              aria-hidden
              className={cn("h-3.5 w-3.5 shrink-0", option.value === value ? "opacity-100" : "opacity-0")}
            />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
