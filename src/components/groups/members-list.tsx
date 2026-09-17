"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, ShieldCheck, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/states";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeMemberAction, updateMemberRoleAction } from "@/lib/actions/groups";
import { useRealtimeGroupMembers } from "@/hooks/use-realtime";
import { formatDate, initials } from "@/lib/utils";
import type { GroupMemberWithProfile, GroupRole } from "@/types/domain";

export function MembersList({
  groupId,
  members,
  myRole,
  currentUserId,
}: {
  groupId: string;
  members: GroupMemberWithProfile[];
  myRole: GroupRole | null;
  currentUserId?: string;
}) {
  const router = useRouter();
  useRealtimeGroupMembers(groupId);

  const [removeTarget, setRemoveTarget] = React.useState<GroupMemberWithProfile | null>(null);
  const [busy, setBusy] = React.useState(false);
  const isAdminOrOwner = myRole === "owner" || myRole === "admin";

  async function handleRoleChange(member: GroupMemberWithProfile, role: "admin" | "member") {
    const result = await updateMemberRoleAction(groupId, member.user_id, role);
    if (!result.success) toast.error(result.error);
    else {
      toast.success(`${member.profile.username} is now ${role === "admin" ? "an admin" : "a member"}`);
      router.refresh();
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setBusy(true);
    const result = await removeMemberAction(groupId, removeTarget.user_id);
    setBusy(false);
    setRemoveTarget(null);
    if (!result.success) toast.error(result.error);
    else {
      toast.success(`Removed ${removeTarget.profile.username}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const canManage = isAdminOrOwner && m.role !== "owner" && m.user_id !== currentUserId;
        return (
          <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarImage src={m.profile.avatar_url ?? undefined} />
                <AvatarFallback>{initials(m.profile.full_name || m.profile.username)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.profile.full_name || m.profile.username}
                  {m.user_id === currentUserId ? <span className="ml-1 text-xs text-muted-foreground">(you)</span> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{m.profile.username} · Joined {formatDate(m.joined_at)}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">
                {m.role === "owner" ? <ShieldCheck className="mr-1 h-3 w-3" /> : null}
                {m.role}
              </Badge>
              {canManage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Manage ${m.profile.username}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {m.role === "member" ? (
                      <DropdownMenuItem onClick={() => handleRoleChange(m, "admin")}>Make admin</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleRoleChange(m, "member")}>Remove admin</DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => setRemoveTarget(m)}>
                      <UserMinus className="h-4 w-4" /> Remove from group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this member?"
        description={`${removeTarget?.profile.username ?? "This member"} will lose access to the group.`}
        confirmLabel="Remove"
        loading={busy}
        onConfirm={handleRemove}
      />
    </div>
  );
}
