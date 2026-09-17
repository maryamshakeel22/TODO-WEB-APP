// @ts-nocheck
/* eslint-disable */
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

function friendlyDbError(message: string): string {
  if (message.includes("groups_name_length")) return "Group name must be between 2 and 80 characters.";
  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "You don't have permission to do that.";
  }
  if (message.includes("duplicate key")) return "That already exists.";
  return "Something went wrong. Please try again.";
}

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().nullable(),
  visibility: z.enum(["public", "private"]).default("public"),
});

export async function createGroupAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: (formData.get("description") as string) || null,
    visibility: (formData.get("visibility") as string) || "public",
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
      owner_id: user.id,
    } as any)
    .select("id")
    .single();

  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/groups");
  revalidatePath("/groups/finder");
  return { success: true, data: { id: (data as any).id } };
}

export async function joinPublicGroupAction(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id, role: "member" } as any);

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { success: false, error: "You're already a member of this group." };
    }
    return { success: false, error: friendlyDbError(error.message) };
  }

  revalidatePath("/groups");
  revalidatePath("/groups/finder");
  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}

export async function leaveGroupAction(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: error.message.includes("row-level security")
        ? "Owners can't leave their own group. Transfer or delete it instead."
        : friendlyDbError(error.message),
    };
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}

export async function updateMemberRoleAction(
  groupId: string,
  userId: string,
  role: "admin" | "member"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .update({ role } as any)
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) return { success: false, error: friendlyDbError(error.message) };
  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}

export async function removeMemberAction(groupId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) return { success: false, error: friendlyDbError(error.message) };
  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}

export async function deleteGroupAction(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) return { success: false, error: friendlyDbError(error.message) };
  revalidatePath("/groups");
  revalidatePath("/groups/finder");
  return { success: true, data: undefined };
}