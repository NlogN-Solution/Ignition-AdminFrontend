import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadPriority, LeadSource, type LeadSource as LeadSourceType } from "@/types/enums";
import { toTitleCase } from "@/utils/format";
import { useCreateLead, useUpdateLead } from "./hooks";
import type { LeadRead } from "./types";
import { Loader2 } from "lucide-react";

const leadFormSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(7, "Enter a valid phone number"),
  source: z.string(),
  priority: z.string(),
  interested_country: z.string().optional(),
  interested_course: z.string().optional(),
  preferred_intake: z.string().optional(),
  remarks: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

const DEFAULTS: LeadFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  source: LeadSource.WEBSITE,
  priority: LeadPriority.WARM,
  interested_country: "",
  interested_course: "",
  preferred_intake: "",
  remarks: "",
};

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadRead | null;
}) {
  const isEdit = Boolean(lead);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead(lead?.id ?? "");
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({ resolver: zodResolver(leadFormSchema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) {
      reset(
        lead
          ? {
              first_name: lead.first_name,
              last_name: lead.last_name ?? "",
              email: lead.email ?? "",
              phone: lead.phone,
              source: lead.source,
              priority: lead.priority,
              interested_country: lead.interested_country ?? "",
              interested_course: lead.interested_course ?? "",
              preferred_intake: lead.preferred_intake ?? "",
              remarks: lead.remarks ?? "",
            }
          : DEFAULTS,
      );
    }
  }, [open, lead, reset]);

  const onSubmit = (values: LeadFormValues) => {
    const payload = { ...values, email: values.email || undefined, source: values.source as LeadSourceType, priority: values.priority as LeadPriority };
    if (isEdit) {
      updateLead.mutate(payload, { onSuccess: () => onOpenChange(false) });
    } else {
      createLead.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = isEdit ? updateLead.isPending : createLead.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "Add lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input {...register("first_name")} placeholder="Jane" />
              {errors.first_name && <p className="text-xs text-danger">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input {...register("last_name")} placeholder="Doe" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="98XXXXXXXX" />
              {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...register("email")} placeholder="jane@email.com" />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Controller
                control={control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(LeadSource).map((source) => (
                        <SelectItem key={source} value={source}>
                          {toTitleCase(source)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(LeadPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {toTitleCase(priority)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Interested country</Label>
              <Input {...register("interested_country")} placeholder="Australia" />
            </div>
            <div className="space-y-1.5">
              <Label>Interested course</Label>
              <Input {...register("interested_course")} placeholder="MBA" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Preferred intake</Label>
            <Input {...register("preferred_intake")} placeholder="Fall 2026" />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("remarks")} rows={2} placeholder="Any context worth remembering…" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
