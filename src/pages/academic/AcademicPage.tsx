import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Globe2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversityPicker, ProgramPicker, CountryPicker } from "@/modules/academic/pickers";
import {
  useCountries,
  useUniversities,
  usePrograms,
  useIntakes,
  useCreateCountry,
  useCreateUniversity,
  useCreateProgram,
  useCreateIntake,
  useDeleteCountry,
  useDeleteUniversity,
  useDeleteProgram,
  useDeleteIntake,
} from "@/modules/academic/hooks";
import { toTitleCase } from "@/utils/format";

const TABS = ["countries", "universities", "programs", "intakes"] as const;

export function AcademicPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const active = TABS.includes(tab as any) ? (tab as (typeof TABS)[number]) : "countries";

  return (
    <div>
      <PageHeader title="Academic data" description="Countries, universities, courses, and intakes used across applications." />

      <Tabs value={active} onValueChange={(v) => navigate(`/academic/${v}`)}>
        <TabsList>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="universities">Universities</TabsTrigger>
          <TabsTrigger value="programs">Courses</TabsTrigger>
          <TabsTrigger value="intakes">Intakes</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {active === "countries" && <CountriesTab />}
        {active === "universities" && <UniversitiesTab />}
        {active === "programs" && <ProgramsTab />}
        {active === "intakes" && <IntakesTab />}
      </div>
    </div>
  );
}

function CountriesTab() {
  const { data, isLoading } = useCountries({ limit: 100 });
  const createCountry = useCreateCountry();
  const deleteCountry = useDeleteCountry();
  const [name, setName] = useState("");
  const [iso2, setIso2] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Country name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Australia" />
        </div>
        <div className="w-24 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">ISO2</label>
          <Input value={iso2} onChange={(e) => setIso2(e.target.value.toUpperCase())} placeholder="AU" maxLength={2} />
        </div>
        <Button
          disabled={!name || iso2.length !== 2 || createCountry.isPending}
          onClick={() => createCountry.mutate({ name, iso2 }, { onSuccess: () => { setName(""); setIso2(""); } })}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Globe2} title="No countries yet" description="Add the destinations your consultancy places applicants in." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {data.items.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <Badge variant="secondary">{c.iso2}</Badge>
                {!c.is_active && <Badge variant="outline">Inactive</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => deleteCountry.mutate(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UniversitiesTab() {
  const { data, isLoading } = useUniversities({ limit: 100 });
  const createUniversity = useCreateUniversity();
  const deleteUniversity = useDeleteUniversity();
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState<string | undefined>();

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">University name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="University of Sydney" />
        </div>
        <div className="w-56 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Country</label>
          <CountryPicker value={countryId} onChange={setCountryId} />
        </div>
        <Button
          disabled={!name || !countryId || createUniversity.isPending}
          onClick={() => countryId && createUniversity.mutate({ name, country_id: countryId }, { onSuccess: () => setName("") })}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Globe2} title="No universities yet" description="Add partner universities to use in applications." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {data.items.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-foreground">{u.name}</span>
                {u.is_partner && <Badge>Partner</Badge>}
                {u.city && <span className="text-xs text-muted-foreground">{u.city}</span>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => deleteUniversity.mutate(u.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramsTab() {
  const { data, isLoading } = usePrograms({ limit: 100 });
  const createProgram = useCreateProgram();
  const deleteProgram = useDeleteProgram();
  const [name, setName] = useState("");
  const [universityId, setUniversityId] = useState<string | undefined>();

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Course name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Master of Business Administration" />
        </div>
        <div className="w-56 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">University</label>
          <UniversityPicker value={universityId} onChange={setUniversityId} />
        </div>
        <Button
          disabled={!name || !universityId || createProgram.isPending}
          onClick={() => universityId && createProgram.mutate({ name, university_id: universityId }, { onSuccess: () => setName("") })}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Globe2} title="No courses yet" description="Add courses offered by your partner universities." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {data.items.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-foreground">{p.name}</span>
                {p.degree_level && <Badge variant="secondary">{toTitleCase(p.degree_level)}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => deleteProgram.mutate(p.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IntakesTab() {
  const [programId, setProgramId] = useState<string | undefined>();
  const { data, isLoading } = useIntakes({ program_id: programId, limit: 100 });
  const createIntake = useCreateIntake();
  const deleteIntake = useDeleteIntake();
  const [name, setName] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
        <div className="w-56 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Course</label>
          <ProgramPicker value={programId} onChange={setProgramId} />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Intake name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fall 2026" disabled={!programId} />
        </div>
        <Button
          disabled={!name || !programId || createIntake.isPending}
          onClick={() => programId && createIntake.mutate({ name, program_id: programId }, { onSuccess: () => setName("") })}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {!programId ? (
        <EmptyState icon={Globe2} title="Select a course" description="Choose a course above to see and manage its intakes." />
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={Globe2} title="No intakes yet" description="Add an intake window for this course." />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {data.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{i.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-danger" onClick={() => deleteIntake.mutate(i.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
