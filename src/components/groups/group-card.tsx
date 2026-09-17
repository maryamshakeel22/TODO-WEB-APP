"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Globe, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { joinPublicGroupAction } from "@/lib/actions/groups";
import type { GroupWithMemberCount } from "@/types/domain";

export function GroupCard({ group, showJoin }: { group: GroupWithMemberCount; showJoin?: boolean }) {
  const router = useRouter();
  const [joining, setJoining] = React.useState(false);
  const alreadyMember = Boolean(group.my_role);

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setJoining(true);
    const result = await joinPublicGroupAction(group.id);
    setJoining(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Joined ${group.name}`);
    router.push(`/groups/${group.id}`);
  }

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{group.name}</h3>
            <Badge variant="outline" className="shrink-0 gap-1">
              {group.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {group.visibility === "public" ? "Public" : "Private"}
            </Badge>
          </div>
          <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
            {group.description || "No description provided."}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {group.member_count} {group.member_count === 1 ? "member" : "members"}
            </span>
            {showJoin && !alreadyMember ? (
              <Button size="sm" onClick={handleJoin} loading={joining}>
                Join
              </Button>
            ) : alreadyMember ? (
              <Badge variant="secondary" className="capitalize">
                {group.my_role}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
