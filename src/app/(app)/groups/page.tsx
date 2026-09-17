import Link from "next/link";
import { Users, Compass } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { GroupCard } from "@/components/groups/group-card";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { InvitationsList } from "@/components/groups/invitations-list";
import { listMyGroups } from "@/lib/data/groups";
import { listMyPendingInvitations } from "@/lib/data/invitations";

export default async function GroupsPage() {
  const [groups, invitations] = await Promise.all([
    listMyGroups(),
    listMyPendingInvitations(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Groups</h2>
          <p className="text-sm text-muted-foreground">
            Groups you belong to and invitations you&apos;ve received.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/groups/finder">
              <Compass className="h-4 w-4" /> Find groups
            </Link>
          </Button>
          <CreateGroupDialog />
        </div>
      </div>

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">My groups ({groups.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations {invitations.length > 0 ? `(${invitations.length})` : ""}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="groups">
          {groups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10 text-muted-foreground" />}
              title="You haven't joined any groups yet"
              description="Create a group or discover public groups to join."
              action={
                <Button size="sm" asChild>
                  <Link href="/groups/finder">Find groups</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsList invitations={invitations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}