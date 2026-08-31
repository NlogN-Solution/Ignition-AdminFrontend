import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * The small parts every block form is built from.
 *
 * Block `data` is untyped JSONB on the way to the database, so these read and
 * write through `Record<string, unknown>` and coerce at the edge — one place
 * where a missing key becomes `""` rather than ten.
 */

export function str(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return value == null ? "" : String(value);
}

export function rows(data: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = data[key];
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export function strings(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  return Array.isArray(value) ? value.map((entry) => (entry == null ? "" : String(entry))) : [];
}

export function nested(data: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = data[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

export function AreaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows: rowCount = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        value={value}
        rows={rowCount}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

/**
 * A repeating group of objects — cards, stages, questions, figures.
 *
 * Rows are keyed by index rather than by content: these lists are short, and
 * keying by a field the editor is actively typing into would remount the
 * input on every keystroke and lose the caret.
 */
export function Repeater({
  label,
  hint,
  items,
  onChange,
  empty,
  addLabel,
  renderRow,
}: {
  label: string;
  hint?: string;
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
  empty: Record<string, unknown>;
  addLabel: string;
  renderRow: (item: Record<string, unknown>, set: (key: string, value: unknown) => void) => ReactNode;
}) {
  const update = (index: number, key: string, value: unknown) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <span className="text-[11px] tabular-nums text-muted-foreground/70">{items.length}</span>
      </div>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/80">{hint}</p>}

      <div className="space-y-2">
        {items.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="relative rounded-lg border border-border bg-muted/30 p-3 pr-9">
            <div className="space-y-2">{renderRow(item, (key, value) => update(index, key, value))}</div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1.5 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        onClick={() => onChange([...items, { ...empty }])}
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

/** A repeating group of plain strings — bullet points, list items. */
export function StringRepeater({
  label,
  hint,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground/80">{hint}</p>}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(event) => onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}
