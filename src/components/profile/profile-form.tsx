"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/lib/actions/profile";
import type { Profile } from "@/types/domain";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bioLength, setBioLength] = React.useState(profile.bio?.length ?? 0);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateProfileAction(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required minLength={3} maxLength={30} defaultValue={profile.username} />
        <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only. Must be unique.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" maxLength={100} defaultValue={profile.full_name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          maxLength={500}
          rows={4}
          defaultValue={profile.bio ?? ""}
          onChange={(e) => setBioLength(e.target.value.length)}
          placeholder="Tell others a bit about yourself"
        />
        <p className="text-right text-xs text-muted-foreground">{bioLength}/500</p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
