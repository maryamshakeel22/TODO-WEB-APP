"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/states";
import { removeAvatarAction, uploadAvatarAction } from "@/lib/actions/profile";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types/domain";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function AvatarUploader({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = React.useState(false);
  // Optimistic local preview so the swap feels instant; replaced by
  // the real (revalidated) profile.avatar_url once the server
  // component re-renders after router.refresh().
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [cleared, setCleared] = React.useState(false);

  const displayName = profile?.full_name || profile?.username || "You";
  const currentAvatar = cleared ? undefined : previewUrl ?? profile?.avatar_url ?? undefined;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPEG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 2MB or smaller.");
      return;
    }

    setUploading(true);
    setCleared(false);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.set("file", file);
    // Server action: uploads the new file first, only updates
    // profiles.avatar_url once that succeeds, and only then deletes
    // the previous avatar object(s). See lib/actions/profile.ts.
    const result = await uploadAvatarAction(formData);
    setUploading(false);
    URL.revokeObjectURL(localPreview);

    if (!result.success) {
      setPreviewUrl(null);
      toast.error(result.error);
      return;
    }

    setPreviewUrl(result.data.avatarUrl);
    toast.success("Profile photo updated");
    router.refresh();
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await removeAvatarAction();
    setRemoving(false);
    setConfirmRemoveOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setPreviewUrl(null);
    setCleared(true);
    toast.success("Profile photo removed");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={currentAvatar} alt={displayName} />
          <AvatarFallback className="text-lg">{initials(displayName)}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || removing}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">PNG, JPEG, WEBP or GIF. Max 2MB.</p>
        </div>
        {currentAvatar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmRemoveOpen(true)}
            disabled={uploading || removing}
          >
            <X className="h-3 w-3" /> Remove photo
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title="Remove profile photo?"
        description="Your avatar will be deleted and you'll show up with your initials instead."
        confirmLabel="Remove"
        loading={removing}
        onConfirm={handleRemove}
      />
    </div>
  );
}
