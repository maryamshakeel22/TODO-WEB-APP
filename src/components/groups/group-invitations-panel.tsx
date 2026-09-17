"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Mail } from "lucide-react";
import { cancelInvitationAction } from "@/lib/actions/invitations";
import { relativeTime } from "@/lib/utils";
import type { InvitationWithRelations } from "@/types/domain";

const STATUS_VARIANT = {
  pending: "secondary",
  accepted: "success",
  rejected: "destructive",
  cancelled: "outline",
} as const;

export function GroupInvitationsPanel({
  groupId,
  invitations,
}: {
  groupId: string;
  invitations: InvitationWithRelations[];
}) {
  const router = useRouter();

  async function handleCancel(id: string) {
    const result = await cancelInvitationAction(id, groupId);
    if (!result.success) toast.error(result.error);
    else {
      toast.success("Invitation cancelled");
      router.refresh();
    }
  }

  if (invitations.length === 0) {
    return <EmptyState  title="No invitations sent yet" description="Invite members from the button above." />;
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">{inv.invitee?.username ?? "Unknown user"}</p>
            <p className="text-xs text-muted-foreground">
              Invited by {inv.inviter?.username ?? "someone"} · {relativeTime(inv.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[inv.status]} className="capitalize">
              {inv.status}
            </Badge>
            {inv.status === "pending" ? (
              <Button variant="ghost" size="icon" aria-label="Cancel invitation" onClick={() => handleCancel(inv.id)}>
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
