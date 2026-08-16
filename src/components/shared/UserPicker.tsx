import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useUsers } from "@/modules/users/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import type { UserRole } from "@/types/enums";
import { cn } from "@/lib/utils";

interface UserPickerProps {
  value?: string | null;
  onChange: (userId: string) => void;
  role?: UserRole;
  placeholder?: string;
  disabled?: boolean;
}

export function UserPicker({ value, onChange, role, placeholder = "Select person…", disabled }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading } = useUsers({ search: debouncedSearch || undefined, role, limit: 20 });
  const selected = data?.items.find((u) => u.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected ? `${selected.first_name} ${selected.last_name}` : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search people…" value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <CommandEmpty>No one found.</CommandEmpty>
            <CommandGroup>
              {data?.items.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-3.5 w-3.5", value === user.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
