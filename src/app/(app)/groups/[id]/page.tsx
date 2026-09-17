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

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const group = await getGroupDetail(id);
  // RLS returns nothing for private groups the user can't see, and
  // for ids that don't exist - both are correctly treated as 404
  // rather than leaking which case it was.
  if (!group) notFound();

  const isAdminOrOwner = group.my_role === "owner" || group.my_role === "admin";

  const [members, tasks, invitations] = await Promise.all([
    listGroupMembers(id),
    group.my_role ? listTodos({ scope: { groupId: id } }) : Promise.resolve([]),
    isAdminOrOwner ? listGroupInvitations(id) : Promise.resolve([]),
  ]);

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
