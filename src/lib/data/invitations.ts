import { createClient } from "@/lib/supabase/server";
import type { InvitationWithRelations } from "@/types/domain";

const INVITATION_SELECT =
  "*, group:groups(id, name, visibility), inviter:profiles!group_invitations_inviter_id_fkey(id, username, full_name, avatar_url), invitee:profiles!group_invitations_invitee_id_fkey(id, username, full_name, avatar_url)";

export async function listMyPendingInvitations(): Promise<InvitationWithRelations[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("group_invitations")
    .select(INVITATION_SELECT)
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as InvitationWithRelations[];
}

export async function listGroupInvitations(groupId: string): Promise<InvitationWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_invitations")
    .select(INVITATION_SELECT)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as InvitationWithRelations[];
}
