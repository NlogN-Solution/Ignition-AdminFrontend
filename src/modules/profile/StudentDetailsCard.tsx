import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useStudentProfile, useUpsertStudentProfile } from "@/modules/users/hooks";
import { InstitutionType } from "@/types/enums";
import { toTitleCase } from "@/utils/format";

export function StudentDetailsCard({ userId }: { userId: string }) {
  const { data: profile } = useStudentProfile(userId);
  const upsert = useUpsertStudentProfile(userId);

  const [educationLevel, setEducationLevel] = useState<string>(InstitutionType.BACHELOR);
  const [nationality, setNationality] = useState("");
  const [passport, setPassport] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [preferredProgram, setPreferredProgram] = useState("");
  const [preferredIntake, setPreferredIntake] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setEducationLevel(profile?.education_level ?? InstitutionType.BACHELOR);
    setNationality(profile?.nationality ?? "");
    setPassport(profile?.passport_number ?? "");
    setBirthPlace(profile?.birth_place ?? "");
    setFatherName(profile?.father_name ?? "");
    setMotherName(profile?.mother_name ?? "");
    setCurrentAddress(profile?.current_address ?? "");
    setPermanentAddress(profile?.permanent_address ?? "");
    setEmergencyName(profile?.emergency_contact_name ?? "");
    setEmergencyPhone(profile?.emergency_contact_phone ?? "");
    setPreferredCountry(profile?.preferred_country ?? "");
    setPreferredProgram(profile?.preferred_program ?? "");
    setPreferredIntake(profile?.preferred_intake ?? "");
    setBudget(profile?.budget ? String(profile.budget) : "");
    setNotes(profile?.notes ?? "");
  }, [profile]);

  function handleSubmit() {
    upsert.mutate({
      education_level: educationLevel as InstitutionType,
      nationality: nationality || undefined,
      passport_number: passport || undefined,
      birth_place: birthPlace || undefined,
      father_name: fatherName || undefined,
      mother_name: motherName || undefined,
      current_address: currentAddress || undefined,
      permanent_address: permanentAddress || undefined,
      emergency_contact_name: emergencyName || undefined,
      emergency_contact_phone: emergencyPhone || undefined,
      preferred_country: preferredCountry || undefined,
      preferred_program: preferredProgram || undefined,
      preferred_intake: preferredIntake || undefined,
      budget: budget ? Number(budget) : undefined,
      notes: notes || undefined,
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Student details</h2>
      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground">Family &amp; identity</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Father's name</Label>
            <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mother's name</Label>
            <Input value={motherName} onChange={(e) => setMotherName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nationality</Label>
            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Nepali" />
          </div>
          <div className="space-y-1.5">
            <Label>Place of birth</Label>
            <Input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Passport number</Label>
          <Input value={passport} onChange={(e) => setPassport(e.target.value)} />
        </div>

        <Separator />
        <p className="text-xs font-medium text-muted-foreground">Address</p>
        <div className="space-y-1.5">
          <Label>Current / temporary address</Label>
          <Textarea value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Permanent address</Label>
          <Textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={2} />
        </div>

        <Separator />
        <p className="text-xs font-medium text-muted-foreground">Emergency contact</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Contact name</Label>
            <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact phone</Label>
            <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
          </div>
        </div>

        <Separator />
        <p className="text-xs font-medium text-muted-foreground">Study preferences</p>
        <div className="space-y-1.5">
          <Label>Highest education level</Label>
          <Select value={educationLevel} onValueChange={setEducationLevel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(InstitutionType).map((t) => (
                <SelectItem key={t} value={t}>
                  {toTitleCase(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Preferred country</Label>
            <Input value={preferredCountry} onChange={(e) => setPreferredCountry(e.target.value)} placeholder="Australia" />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred program</Label>
            <Input value={preferredProgram} onChange={(e) => setPreferredProgram(e.target.value)} placeholder="MBA" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Preferred intake</Label>
            <Input value={preferredIntake} onChange={(e) => setPreferredIntake(e.target.value)} placeholder="Fall 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Budget</Label>
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="flex justify-end">
          <Button size="sm" disabled={upsert.isPending} onClick={handleSubmit}>
            {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </section>
  );
}
