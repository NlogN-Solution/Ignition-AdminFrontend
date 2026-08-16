import type { ReactNode } from "react";
import { Search, SlidersHorizontal, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnOption {
  id: string;
  label: string;
  visible: boolean;
}

interface ListToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  columns?: ColumnOption[];
  onToggleColumn?: (id: string) => void;
  onExport?: () => void;
  selectedCount?: number;
  bulkActions?: ReactNode;
  onClearSelection?: () => void;
}

export function ListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  columns,
  onToggleColumn,
  onExport,
  selectedCount,
  bulkActions,
  onClearSelection,
}: ListToolbarProps) {
  if (selectedCount && selectedCount > 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearSelection}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-medium text-foreground">{selectedCount} selected</span>
        </div>
        <div className="flex items-center gap-2">{bulkActions}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSearchChange && (
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-[13px]"
          />
        </div>
      )}

      {filters}

      <div className="ml-auto flex items-center gap-2">
        {columns && onToggleColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((col) => (
                <DropdownMenuCheckboxItem key={col.id} checked={col.visible} onCheckedChange={() => onToggleColumn(col.id)}>
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onExport && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
