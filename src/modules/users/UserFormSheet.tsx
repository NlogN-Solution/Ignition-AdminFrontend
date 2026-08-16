import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserPicker } from "@/components/shared/UserPicker";
import { useAuthStore } from "@/services/authStore";
import { canManageTarget } from "@/constants/permissions";
import { UserRole, UserStatus } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useEmployeeProfile, useUpdateUser, useUpsertEmployeeProfile } from "./hooks";
import type { UserRead } from "./types";

export function UserFormSheet({ user, open, onOpenChange }: { user: UserRead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateUser = useUpdateUser(user?.id ?? "");
  const upsertProfile = useUpsertEmployeeProfile(user?.id ?? "");
  const { data: employeeProfile } = useEmployeeProfile(user?.id);
  const actingRole = useAuthStore((s) => s.user?.role);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>(UserRole.STUDENT);
  const [status, setStatus] = useState<string>(UserStatus.ACTIVE);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  useEffect(() => {
    setDepartment(employeeProfile?.department ?? "");
    setDesignation(employeeProfile?.designation ?? "");
    setOfficeLocation(employeeProfile?.office_location ?? "");
    setManagerId(employeeProfile?.manager_id ?? null);
  }, [employeeProfile]);

  if (!user) return null;

  const isSelf = user.id === currentUserId;
  const canEditRole = isSelf ? false : canManageTarget(actingRole, user.role, role as UserRole);
  const isStaffRole = role !== UserRole.STUDENT;

  function handleSubmit() {
    updateUser.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        role: canEditRole ? (role as UserRole) : undefined,
        status: status as UserStatus,
      },
      {
        onSuccess: () => {
          if (isStaffRole) {
            upsertProfile.mutate({
              department: department || null,
              designation: designation || null,
              office_location: officeLocation || null,
              manager_id: managerId,
            });
          }
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit user</SheetTitle>
          <SheetDescription>{user.email}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
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
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole} disabled={!canManageTarget(actingRole, user.role) || isSelf}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((r) => (
                    <SelectItem key={r} value={r} disabled={!canManageTarget(actingRole, user.role, r)}>
                      {toTitleCase(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isStaffRole && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground">Employee details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Admissions" />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Senior Counsellor" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Branch / office location</Label>
                <Input value={officeLocation} onChange={(e) => setOfficeLocation(e.target.value)} placeholder="Kathmandu HQ" />
              </div>
              <div className="space-y-1.5">
                <Label>Reporting manager</Label>
                <UserPicker value={managerId} onChange={setManagerId} placeholder="Select a manager…" />
              </div>
            </>
          )}
        </div>
        <SheetFooter>
          <Button disabled={updateUser.isPending} onClick={handleSubmit}>
            {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
