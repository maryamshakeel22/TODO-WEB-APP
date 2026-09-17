import type { Enums, Tables } from "@/types/database.types";

export type Profile = Tables<"profiles">;
export type Group = Tables<"groups">;
export type GroupMember = Tables<"group_members">;
export type Todo = Tables<"todos">;
export type Notification = Tables<"notifications">;
export type GroupInvitation = Tables<"group_invitations">;

export type TodoStatus = Enums<"todo_status">;
export type TodoPriority = Enums<"todo_priority">;
export type GroupRole = Enums<"group_role">;
export type GroupVisibility = Enums<"group_visibility">;
export type InvitationStatus = Enums<"invitation_status">;
export type NotificationType = Enums<"notification_type">;

/** A todo joined with the minimal profile + group info the UI needs. */
export type TodoWithRelations = Todo & {
  creator: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
  assignee: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
  group: Pick<Group, "id" | "name"> | null;
};

/** A group_members row joined with the member's profile. */
export type GroupMemberWithProfile = GroupMember & {
  profile: Pick<Profile, "id" | "username" | "full_name" | "avatar_url">;
};

/** A group_invitations row joined with group + inviter/invitee profiles. */
export type InvitationWithRelations = GroupInvitation & {
  group: Pick<Group, "id" | "name" | "visibility"> | null;
  inviter: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
  invitee: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
};

/** A group row joined with a computed member count (via a separate count query). */
export type GroupWithMemberCount = Group & {
  member_count: number;
  my_role: GroupRole | null;
};

export type NotificationWithActor = Notification & {
  actor: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
};

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
