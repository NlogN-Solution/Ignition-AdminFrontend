import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, GraduationCap, Moon, Sun, Monitor, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/hooks/useUIStore";
import { useThemeStore } from "@/hooks/useTheme";
import { useAuthStore } from "@/services/authStore";
import { canAccessModule } from "@/constants/permissions";
import { NAV_GROUPS } from "@/constants/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/services/apiClient";
import type { ListResponse } from "@/types/api";

interface QuickLead {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
}

interface QuickUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const setPreference = useThemeStore((s) => s.setPreference);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const canSearchLeads = canAccessModule(role, "leads");
  const canSearchApplicants = canAccessModule(role, "applicants");

  const { data: leadResults } = useQuery({
    queryKey: ["command-palette", "leads", debouncedQuery],
    queryFn: async () => {
      const { data } = await apiClient.get<ListResponse<QuickLead>>("/leads", { params: { search: debouncedQuery, limit: 5 } });
      return data.items;
    },
    enabled: open && debouncedQuery.length > 1 && canSearchLeads,
  });

  const { data: applicantResults } = useQuery({
    queryKey: ["command-palette", "applicants", debouncedQuery],
    queryFn: async () => {
      const { data } = await apiClient.get<ListResponse<QuickUser>>("/users", {
        params: { search: debouncedQuery, role: "student", limit: 5 },
      });
      return data.items;
    },
    enabled: open && debouncedQuery.length > 1 && canSearchApplicants,
  });

  function go(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search records, jump to any page, or run a quick action">
      <CommandInput placeholder="Search leads, applicants, pages…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {leadResults && leadResults.length > 0 && (
          <CommandGroup heading="Leads">
            {leadResults.map((lead) => (
              <CommandItem key={lead.id} onSelect={() => go(`/leads/${lead.id}`)}>
                <UserPlus className="text-muted-foreground" />
                {lead.first_name} {lead.last_name ?? ""}
                <span className="ml-auto text-xs text-muted-foreground">{lead.phone}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {applicantResults && applicantResults.length > 0 && (
          <CommandGroup heading="Applicants">
            {applicantResults.map((u) => (
              <CommandItem key={u.id} onSelect={() => go(`/applicants/${u.id}`)}>
                <GraduationCap className="text-muted-foreground" />
                {u.first_name} {u.last_name}
                <span className="ml-auto text-xs text-muted-foreground">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!debouncedQuery && (
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => go("/leads?new=1")}>
              <Plus className="text-muted-foreground" />
              Add applicant / lead
            </CommandItem>
            <CommandItem onSelect={() => go("/tasks?new=1")}>
              <Plus className="text-muted-foreground" />
              Create task
            </CommandItem>
            <CommandItem onSelect={() => go("/appointments?new=1")}>
              <Plus className="text-muted-foreground" />
              Book appointment
            </CommandItem>
            <CommandItem onSelect={() => go("/payments?new=1")}>
              <Plus className="text-muted-foreground" />
              Record payment
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) =>
            canAccessModule(role, item.module),
          );
          if (items.length === 0) return null;
          return (
            <CommandGroup key={group.label} heading={group.label}>
              {items.map((item) => (
                <CommandItem key={item.path} onSelect={() => go(item.path)}>
                  <item.icon className="text-muted-foreground" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => setPreference("light")}>
            <Sun className="text-muted-foreground" />
            Light
          </CommandItem>
          <CommandItem onSelect={() => setPreference("dark")}>
            <Moon className="text-muted-foreground" />
            Dark
          </CommandItem>
          <CommandItem onSelect={() => setPreference("system")}>
            <Monitor className="text-muted-foreground" />
            System
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
