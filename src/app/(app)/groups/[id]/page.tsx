import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupHeader } from "@/components/groups/group-header";
import { MembersList } from "@/components/groups/members-list";
import { GroupInvitationsPanel } from "@/components/groups/group-invitations-panel";
import { TaskList } from "@/components/tasks/task-list";
import { createClient } from "@/lib/supabase/server";
import { getGroupDetail, listGroupMembers } from "@/lib/data/groups";
import { listGroupInvitations } from "@/lib/data/invitations";
import { listTodos } from "@/lib/data/todos";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let group = null;
  try {
    group = await getGroupDetail(id);
  } catch (e) {
    group = null;
  }

  if (!group) notFound();

  const isAdminOrOwner = group.my_role === "owner" || group.my_role === "admin";

  let members: any[] = [];
  let tasks: any[] = [];
  let invitations: any[] = [];

  try {
    members = await listGroupMembers(id);
  } catch (e) {
    members = [];
  }

  if (group.my_role) {
    try {
      tasks = await listTodos({ scope: { groupId: id } });
    } catch (e) {
      tasks = [];
    }
  }

  if (isAdminOrOwner) {
    try {
      invitations = await listGroupInvitations(id);
    } catch (e) {
      invitations = [];
    }
  }

  return (
    <div className="space-y-6">
      <GroupHeader group={group} myRole={group.my_role} />

      {group.my_role ? (
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            {isAdminOrOwner ? <TabsTrigger value="invitations">Invitations</TabsTrigger> : null}
          </TabsList>
          <TabsContent value="tasks">
            <TaskList
              tasks={tasks}
              groupId={id}
              groupMembers={members}
              emptyLabel="No tasks in this group yet"
              canCreate={Boolean(group.my_role)}
            />
          </TabsContent>
          <TabsContent value="members">
            <MembersList groupId={id} members={members} myRole={group.my_role} currentUserId={user?.id} />
          </TabsContent>
          {isAdminOrOwner ? (
            <TabsContent value="invitations">
              <GroupInvitationsPanel groupId={id} invitations={invitations} />
            </TabsContent>
          ) : null}
        </Tabs>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          You&apos;re viewing this public group as a non-member. Join to see its tasks and members.
        </div>
      )}
    </div>
  );
}