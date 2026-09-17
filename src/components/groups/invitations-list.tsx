"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { respondToInvitationAction } from "@/lib/actions/invitations";
import { relativeTime } from "@/lib/utils";
import type { InvitationWithRelations } from "@/types/domain";

export function InvitationsList({ invitations }: { invitations: InvitationWithRelations[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function respond(invitation: InvitationWithRelations, response: "accepted" | "rejected") {
    setPendingId(invitation.id);
    const result = await respondToInvitationAction(invitation.id, response);
    setPendingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(response === "accepted" ? `Joined ${invitation.group?.name ?? "the group"}` : "Invitation declined");
    router.refresh();
  }

  if (invitations.length === 0) {
    return <EmptyState icon={Mail} title="No pending invitations" description="Group invitations you receive will show up here." />;
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => (
        <Card key={inv.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-medium">{inv.group?.name ?? "A group"}</p>
              <p className="text-xs text-muted-foreground">
                Invited by {inv.inviter?.username ?? "someone"} · {relativeTime(inv.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => respond(inv, "rejected")}
                loading={pendingId === inv.id}
              >
                <X className="h-4 w-4" /> Decline
              </Button>
              <Button size="sm" onClick={() => respond(inv, "accepted")} loading={pendingId === inv.id}>
                <Check className="h-4 w-4" /> Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
