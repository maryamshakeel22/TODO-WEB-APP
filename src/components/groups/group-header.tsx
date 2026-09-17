"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Lock, LogOut, Trash2, UserPlus, Users, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/states";
import { InviteMemberDialog } from "@/components/groups/invite-member-dialog";
import { leaveGroupAction, deleteGroupAction, joinPublicGroupAction } from "@/lib/actions/groups";
import type { GroupRole, GroupWithMemberCount } from "@/types/domain";

export function GroupHeader({ group, myRole }: { group: GroupWithMemberCount; myRole: GroupRole | null }) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const isOwner = myRole === "owner";
  const isAdminOrOwner = myRole === "owner" || myRole === "admin";

  async function handleLeave() {
    setBusy(true);
    const result = await leaveGroupAction(group.id);
    setBusy(false);
    setLeaveOpen(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Left ${group.name}`);
    router.push("/groups");
  }

  async function handleJoin() {
    setBusy(true);
    const result = await joinPublicGroupAction(group.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Joined ${group.name}`);
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const result = await deleteGroupAction(group.id);
    setBusy(false);
    setDeleteOpen(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Group deleted");
    router.push("/groups");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{group.name}</h2>
            <Badge variant="outline" className="gap-1">
              {group.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {group.visibility === "public" ? "Public" : "Private"}
            </Badge>
            {myRole ? (
              <Badge variant="secondary" className="capitalize">
                {myRole}
              </Badge>
            ) : null}
          </div>
          {group.description ? <p className="max-w-2xl text-sm text-muted-foreground">{group.description}</p> : null}
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdminOrOwner ? (
            <Button variant="outline" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Invite
            </Button>
          ) : null}
          {isOwner ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" /> Delete group
            </Button>
          ) : myRole ? (
            <Button variant="outline" onClick={() => setLeaveOpen(true)}>
              <LogOut className="h-4 w-4" /> Leave
            </Button>
          ) : group.visibility === "public" ? (
            <Button onClick={handleJoin} loading={busy}>
              <LogIn className="h-4 w-4" /> Join group
            </Button>
          ) : null}
        </div>
      </div>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} groupId={group.id} />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave this group?"
        description={`You'll lose access to ${group.name}'s tasks and discussions unless you're invited back.`}
        confirmLabel="Leave group"
        loading={busy}
        onConfirm={handleLeave}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this group?"
        description={`"${group.name}" and all of its tasks will be permanently deleted for every member. This can't be undone.`}
        confirmLabel="Delete group"
        loading={busy}
        onConfirm={handleDelete}
      />
    </div>
  );
}
