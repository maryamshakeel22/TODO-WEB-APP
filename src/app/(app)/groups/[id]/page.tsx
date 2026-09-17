import { notFound, redirect } from "next/navigation";
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

  if (!user) {
    redirect(`/login?redirectTo=/groups/${id}`);
  }

  let rawGroup = null;
  try {
    rawGroup = await getGroupDetail(id);
  } catch {
    rawGroup = null;
  }

  if (!rawGroup) {
    return (
      <div className="rounded-lg border border-dashed border-destructive/50 p-8 text-center space-y-3">
        <h3 className="text-lg font-medium text-destructive">Group Access Denied or Not Found</h3>
        <p className="text-sm text-muted-foreground">
          Aap is group ke member nahi hain ya ye ID exist nahi karti.
        </p>
      </div>
    );
  }

  const group = JSON.parse(JSON.stringify(rawGroup));
  const isAdminOrOwner = group.my_role === "owner" || group.my_role === "admin";

  let members = [];
  let tasks = [];
  let invitations = [];

  try {
    const rawMembers = await listGroupMembers(id);
    members = JSON.parse(JSON.stringify(rawMembers || []));
  } catch {
    members = [];
  }

  if (group.my_role) {
    try {
      const rawTasks = await listTodos({ scope: { groupId: id } });
      tasks = JSON.parse(JSON.stringify(rawTasks || []));
    } catch {
      tasks = [];
    }
  }

  if (isAdminOrOwner) {
    try {
      const rawInvitations = await listGroupInvitations(id);
      invitations = JSON.parse(JSON.stringify(rawInvitations || []));
    } catch {
      invitations = [];
    }
  }

  const currentUserId = String(user.id);

  return (
    <div className="space-y-6">
      <GroupHeader group={group} myRole={group.my_role} />

      {group.my_role ? (
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            {isAdminOrOwner ? (
              <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
            ) : null}
          </TabsList>
          <TabsContent value="tasks">
            <TaskList
              tasks={tasks}
              userId={currentUserId}
              groupId={id}
              groupMembers={members}
              emptyLabel="No tasks in this group yet"
              canCreate={Boolean(group.my_role)}
            />
          </TabsContent>
          <TabsContent value="members">
            <MembersList groupId={id} members={members} myRole={group.my_role} currentUserId={currentUserId} />
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