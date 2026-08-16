import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/services/apiClient";
import { useAuthStore } from "@/services/authStore";
import { useUploadUserAvatar, useUser } from "@/modules/users/hooks";
import { initials } from "@/utils/format";
import { useUploadAvatar } from "./hooks";

export function AvatarUploader({ userId }: { userId?: string } = {}) {
  const isSelf = !userId;
  const selfUser = useAuthStore((s) => s.user);
  const { data: otherUser } = useUser(userId);
  const user = isSelf ? selfUser : otherUser;

  const uploadMyAvatar = useUploadAvatar();
  const uploadOtherAvatar = useUploadUserAvatar(userId ?? "");
  const isPending = isSelf ? uploadMyAvatar.isPending : uploadOtherAvatar.isPending;
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = user?.avatar_url ? (user.avatar_url.startsWith("http") ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`) : undefined;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-16 w-16 border border-border" size="lg">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
          <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
            {initials(user?.first_name, user?.last_name)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (isSelf) uploadMyAvatar.mutate(file);
              else uploadOtherAvatar.mutate(file);
            }
            e.target.value = "";
          }}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {user?.first_name} {user?.last_name}
        </p>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
        <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => inputRef.current?.click()}>
          Change photo
        </Button>
      </div>
    </div>
  );
}
