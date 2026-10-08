import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/services/authStore";
import { UserRole } from "@/types/enums";
import { useDeleteThread } from "./hooks";

export function DeleteThreadButton({ threadId, onDeleted }: { threadId: string; onDeleted: () => void }) {
  const role = useAuthStore((state) => state.user?.role);
  const remove = useDeleteThread();
  if (role !== UserRole.SUPER_ADMIN) return null;
  return <Button size="sm" variant="outline" className="text-danger hover:text-danger" disabled={remove.isPending} onClick={() => {
    if (window.confirm("Delete this conversation and all its messages? This cannot be undone.")) remove.mutate(threadId, { onSuccess: onDeleted });
  }}><Trash2 className="h-3.5 w-3.5" />{remove.isPending ? "Deleting…" : "Delete conversation"}</Button>;
}
