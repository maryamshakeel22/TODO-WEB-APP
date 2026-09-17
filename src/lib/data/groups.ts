import { createClient } from "@/lib/supabase/server";
import type {
  Group,
  GroupMemberWithProfile,
  GroupRole,
  GroupWithMemberCount,
} from "@/types/domain";

async function attachMemberCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groups: Group[],
  myRoleByGroup?: Map<string, GroupRole>
): Promise<GroupWithMemberCount[]> {
  if (groups.length === 0) return [];
  const ids = groups.map((g) => g.id);

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", ids);

  const counts = new Map<string, number>();
  for (const row of memberRows ?? []) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }

  return groups.map((g) => ({
    ...g,
    member_count: counts.get(g.id) ?? 0,
    my_role: myRoleByGroup?.get(g.id) ?? null,
  }));
}

export async function listMyGroups(): Promise<GroupWithMemberCount[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error: mErr } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id);

  if (mErr || !memberships || memberships.length === 0) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const roleByGroup = new Map(memberships.map((m) => [m.group_id, m.role]));

  const { data: groups, error: gErr } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (gErr || !groups) return [];
  return attachMemberCounts(supabase, groups, roleByGroup);
}

export async function searchPublicGroups(search?: string): Promise<GroupWithMemberCount[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("groups").select("*").eq("visibility", "public");

  if (search && search.trim()) {
    const term = search.trim().slice(0, 100).replace(/[%_]/g, "");
    if (term) query = query.ilike("name", `%${term}%`);
  }

  const { data: groups, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error || !groups) return [];

  let myRoleByGroup: Map<string, GroupRole> | undefined;
  if (user) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, role")
      .eq("user_id", user.id)
      .in(
        "group_id",
        groups.map((g) => g.id)
      );
    myRoleByGroup = new Map((memberships ?? []).map((m) => [m.group_id, m.role]));
  }

  return attachMemberCounts(supabase, groups, myRoleByGroup);
}

export async function getGroupDetail(groupId: string): Promise<GroupWithMemberCount | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group, error } = await supabase.from("groups").select("*").eq("id", groupId).single();
  if (error || !group) return null;

  let myRole: GroupRole | null = null;
  if (user) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();
    myRole = membership?.role ?? null;
  }

  const [withCount] = await attachMemberCounts(supabase, [group], myRole ? new Map([[groupId, myRole]]) : undefined);
  return withCount ?? null;
}

export async function listGroupMembers(groupId: string): Promise<GroupMemberWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("*, profile:profiles(id, username, full_name, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];
  return data as unknown as GroupMemberWithProfile[];
}

export async function getCurrentUserRoleInGroup(groupId: string): Promise<GroupRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.role ?? null;
}
