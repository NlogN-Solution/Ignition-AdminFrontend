import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/services/authStore";
import { useUpdateUser, useUser } from "@/modules/users/hooks";
import { Gender } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useUpdateMyProfile } from "./hooks";

export function PersonalInfoCard({ userId }: { userId?: string } = {}) {
  const isSelf = !userId;
  const selfUser = useAuthStore((s) => s.user);
  const { data: otherUser } = useUser(userId);
  const user = isSelf ? selfUser : otherUser;

  const updateMyProfile = useUpdateMyProfile();
  const updateOtherUser = useUpdateUser(userId ?? "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<string>("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setBio(user.bio ?? "");
      setDateOfBirth(user.date_of_birth ?? "");
      setGender(user.gender ?? "");
    }
  }, [user]);

  const isPending = isSelf ? updateMyProfile.isPending : updateOtherUser.isPending;

  function handleSubmit() {
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      bio: bio || null,
      date_of_birth: dateOfBirth || null,
      gender: (gender || null) as never,
    };
    if (isSelf) {
      updateMyProfile.mutate(payload);
    } else {
      updateOtherUser.mutate(payload);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Personal information</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date of birth</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prefer not to say" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Gender).map((g) => (
                  <SelectItem key={g} value={g}>
                    {toTitleCase(g)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A short bio…" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled={isPending} onClick={handleSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </section>
  );
}
