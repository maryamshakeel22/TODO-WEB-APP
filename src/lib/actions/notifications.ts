// @ts-nocheck
/* eslint-disable */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) return { success: false, error: "Couldn't update that notification." };
  revalidatePath("/notifications");
  return { success: true, data: undefined };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, error: "Couldn't update notifications." };
  revalidatePath("/notifications");
  return { success: true, data: undefined };
}

export async function deleteNotificationAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) return { success: false, error: "Couldn't remove that notification." };
  revalidatePath("/notifications");
  return { success: true, data: undefined };
}