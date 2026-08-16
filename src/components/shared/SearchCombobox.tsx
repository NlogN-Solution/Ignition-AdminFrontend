import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface SearchComboboxProps<T> {
  value?: string | null;
  onChange: (id: string) => void;
  items: T[];
  isLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string | undefined;
  icon?: ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function SearchCombobox<T>({
  value,
  onChange,
  items,
  isLoading,
  search,
  onSearchChange,
  getId,
  getLabel,
  getDescription,
  icon,
  placeholder = "Select…",
  emptyMessage = "Nothing found.",
  disabled,
}: SearchComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => getId(item) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" disabled={disabled} className="w-full justify-between font-normal">
          <span className="flex min-w-0 items-center gap-2">
            {icon}
            <span className="truncate">{selected ? getLabel(selected) : placeholder}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search…" value={search} onValueChange={onSearchChange} />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={getId(item)}
                  value={getId(item)}
                  onSelect={() => {
                    onChange(getId(item));
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-3.5 w-3.5", value === getId(item) ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{getLabel(item)}</span>
                  {getDescription?.(item) && <span className="text-xs text-muted-foreground">{getDescription(item)}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
