import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useStaffDirectory } from "@/modules/users/hooks";
import { StaffDirectoryNameCell } from "@/modules/users/StaffDirectoryNameCell";
import { useDebounce } from "@/hooks/useDebounce";
import { toTitleCase } from "@/utils/format";
import { cn } from "@/lib/utils";

export function AttendeePicker({
  value,
  onChange,
  excludeIds = [],
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const { data, isLoading } = useStaffDirectory({ search: debouncedSearch || undefined, limit: 20 });

  const options = (data ?? []).filter((u) => !value.includes(u.id) && !excludeIds.includes(u.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
              <StaffDirectoryNameCell userId={id} />
              <button type="button" onClick={() => toggle(id)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Plus className="h-3 w-3" /> Add attendee
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search staff…" value={search} onValueChange={setSearch} />
            <CommandList>
              {isLoading && <div className="py-4 text-center text-xs text-muted-foreground">Loading…</div>}
              <CommandEmpty>No one found.</CommandEmpty>
              <CommandGroup>
                {options.map((user) => (
                  <CommandItem key={user.id} value={user.id} onSelect={() => toggle(user.id)}>
                    <Check className={cn("h-3.5 w-3.5", value.includes(user.id) ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{toTitleCase(user.role)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
