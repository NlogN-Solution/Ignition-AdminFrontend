import { useState } from "react";
import { Globe2, Building2, BookOpen, CalendarClock } from "lucide-react";
import { SearchCombobox } from "@/components/shared/SearchCombobox";
import { useDebounce } from "@/hooks/useDebounce";
import { useCountries, useUniversities, usePrograms, useIntakes } from "./hooks";

export function CountryPicker({ value, onChange, disabled }: { value?: string | null; onChange: (id: string) => void; disabled?: boolean }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const { data, isLoading } = useCountries({ search: debounced || undefined, limit: 20 });

  return (
    <SearchCombobox
      value={value}
      onChange={onChange}
      items={data?.items ?? []}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      getId={(c) => c.id}
      getLabel={(c) => c.name}
      getDescription={(c) => c.iso2}
      icon={<Globe2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      placeholder="Select country…"
      disabled={disabled}
    />
  );
}

export function UniversityPicker({
  value,
  onChange,
  countryId,
  disabled,
}: {
  value?: string | null;
  onChange: (id: string) => void;
  countryId?: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const { data, isLoading } = useUniversities({ search: debounced || undefined, country_id: countryId, limit: 20 });

  return (
    <SearchCombobox
      value={value}
      onChange={onChange}
      items={data?.items ?? []}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      getId={(u) => u.id}
      getLabel={(u) => u.name}
      getDescription={(u) => u.city ?? undefined}
      icon={<Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      placeholder="Select university…"
      emptyMessage="No universities found."
      disabled={disabled}
    />
  );
}

export function ProgramPicker({
  value,
  onChange,
  universityId,
  disabled,
}: {
  value?: string | null;
  onChange: (id: string) => void;
  universityId?: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const { data, isLoading } = usePrograms({ search: debounced || undefined, university_id: universityId, limit: 20 });

  return (
    <SearchCombobox
      value={value}
      onChange={onChange}
      items={data?.items ?? []}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      getId={(p) => p.id}
      getLabel={(p) => p.name}
      getDescription={(p) => p.degree_level ?? undefined}
      icon={<BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      placeholder={universityId ? "Select course…" : "Select a university first"}
      emptyMessage="No courses found."
      disabled={disabled || !universityId}
    />
  );
}

export function IntakePicker({
  value,
  onChange,
  programId,
  disabled,
}: {
  value?: string | null;
  onChange: (id: string) => void;
  programId?: string;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useIntakes({ program_id: programId, limit: 20 });
  const filtered = (data?.items ?? []).filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SearchCombobox
      value={value}
      onChange={onChange}
      items={filtered}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      getId={(i) => i.id}
      getLabel={(i) => i.name}
      getDescription={(i) => i.start_date ?? undefined}
      icon={<CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      placeholder={programId ? "Select intake…" : "Select a course first"}
      emptyMessage="No intakes found."
      disabled={disabled || !programId}
    />
  );
}
