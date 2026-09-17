// @ts-nocheck
/* eslint-disable */
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

function friendlyDbError(message: string): string {
  if (message.includes("group_invitations_no_self_invite")) return "You can't invite yourself.";
  if (message.includes("group_invitations_unique_pending"))
    return "That person already has a pending invitation to this group.";
  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "You don't have permission to do that.";
  }
  return "Something went wrong. Please try again.";
}

const inviteSchema = z.object({
  groupId: z.string().uuid(),
  username: z.string().trim().min(1, "Enter a username."),
});

export async function inviteUserAction(formData: FormData): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse({
    groupId: formData.get("groupId"),
    username: formData.get("username"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  // Escape ilike wildcards so the lookup is an exact (case-insensitive)
  // username match, not a pattern search the caller could exploit to
  // match an unintended account (e.g. submitting "%" or "a_c").
  const escapedUsername = parsed.data.username.trim().replace(/[%_\\]/g, "\\$&");

  const { data: invitee, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", escapedUsername)
    .maybeSingle();

  if (lookupError || !invitee) {
    return { success: false, error: "No user found with that username." };
  }

  if (invitee.id === user.id) return { success: false, error: "You can't invite yourself." };

  const { error } = await supabase.from("group_invitations").insert({
    group_id: parsed.data.groupId,
    inviter_id: user.id,
    invitee_id: invitee.id,
  });

  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath(`/groups/${parsed.data.groupId}`);
  return { success: true, data: undefined };
}

export async function respondToInvitationAction(
  invitationId: string,
  response: "accepted" | "rejected"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: invitation, error: fetchError } = await supabase
    .from("group_invitations")
    .select("group_id")
    .eq("id", invitationId)
    .single();

  if (fetchError || !invitation) return { success: false, error: "Invitation not found." };

  const { error } = await supabase
    .from("group_invitations")
    .update({ status: response })
    .eq("id", invitationId);

  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/notifications");
  revalidatePath("/groups");
  revalidatePath(`/groups/${invitation.group_id}`);
  return { success: true, data: undefined };
}

export async function cancelInvitationAction(invitationId: string, groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("group_invitations").delete().eq("id", invitationId);
  if (error) return { success: false, error: friendlyDbError(error.message) };
  revalidatePath(`/groups/${groupId}`);
  return { success: true, data: undefined };
}
