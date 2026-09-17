import { createClient } from "@/lib/supabase/server";
import type { NotificationWithActor } from "@/types/domain";

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Unread count error:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function listNotifications(limit = 30): Promise<NotificationWithActor[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Try fetching with actor profile join
  const { data, error } = await supabase
    .from("notifications")
    .select("*, actor:profiles(id, username, full_name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Notifications fetch error with actor join:", error.message);

    // Fallback: Fetch basic notifications without join if FK fails
    const { data: fallbackData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (fallbackData as unknown as NotificationWithActor[]) || [];
  }

  return (data as unknown as NotificationWithActor[]) || [];
}