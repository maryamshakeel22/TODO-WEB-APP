// @ts-nocheck
/* eslint-disable */
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

function friendlyDbError(message: string): string {
  if (message.includes("profiles_username_key")) return "That username is already taken.";
  if (message.includes("profiles_username_format"))
    return "Usernames can only contain letters, numbers, and underscores.";
  if (message.includes("profiles_username_length")) return "Username must be 3-30 characters.";
  if (message.includes("profiles_bio_length")) return "Bio must be 500 characters or fewer.";
  return "Something went wrong. Please try again.";
}

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // matches the bucket's file_size_limit (see migration 007)
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Removes every object currently sitting in the user's own avatar
 * folder. Storage RLS (avatars_delete_own_folder) already prevents
 * this from touching anyone else's files even if called with a
 * different id by mistake - this is defense in depth, not the only
 * boundary.
 */
async function clearExistingAvatarFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId, { limit: 100 });
  if (!files || files.length === 0) return;
  const paths = files.map((f) => `${userId}/${f.name}`);
  await supabase.storage.from(AVATAR_BUCKET).remove(paths);
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ avatarUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose an image to upload." };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { success: false, error: "Please choose a PNG, JPEG, WEBP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "Image must be 2MB or smaller." };
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  // A fresh, unique path per upload. We only ever delete the old
  // file(s) *after* this new one is confirmed uploaded AND the
  // profile row is confirmed updated - never before.
  const newPath = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(newPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    return { success: false, error: "Upload failed. Please try again." };
  }

  const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(newPath);
  const avatarUrl = publicUrlData.publicUrl;

  const { error: dbError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);

  if (dbError) {
    // The DB doesn't point at the new file - remove it so we don't
    // leave an orphan, and leave the user's previous avatar (still
    // referenced by the unchanged avatar_url) fully intact.
    await supabase.storage.from(AVATAR_BUCKET).remove([newPath]);
    return { success: false, error: "Couldn't save your new avatar. Please try again." };
  }

  // Only now, with the new file uploaded and the profile row
  // successfully pointing at it, do we clean up every previous file
  // in the user's folder (there should only ever be one, but this
  // also mops up any pre-existing orphan from an earlier failure).
  const { data: allFiles } = await supabase.storage.from(AVATAR_BUCKET).list(user.id, { limit: 100 });
  const staleFiles = (allFiles ?? []).filter((f) => `${user.id}/${f.name}` !== newPath);
  if (staleFiles.length > 0) {
    await supabase.storage.from(AVATAR_BUCKET).remove(staleFiles.map((f) => `${user.id}/${f.name}`));
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, data: { avatarUrl } };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { error: dbError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (dbError) return { success: false, error: "Couldn't remove your avatar. Please try again." };

  // The database is already the source of truth (avatar_url is
  // null), so a failure here just leaves a harmless orphan file
  // rather than a broken reference - safe to attempt best-effort.
  await clearExistingAvatarFiles(supabase, user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed."),
  fullName: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    fullName: (formData.get("fullName") as string) || null,
    bio: (formData.get("bio") as string) || null,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      full_name: parsed.data.fullName || null,
      bio: parsed.data.bio || null,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
