import Link from "next/link";
import { CheckSquare, Clock, AlertTriangle, CalendarClock, Users, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getDashboardStats, getRecentTodos } from "@/lib/data/todos";
import { listNotifications } from "@/lib/data/notifications";
import { listMyGroups } from "@/lib/data/groups";
import { getCurrentProfile } from "@/lib/data/profile";
import { formatDate, isOverdue, relativeTime } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";

export default async function DashboardPage() {
  const [statsRes, recentTodosRes, recentNotificationsRes, groupsRes, profileRes] = await Promise.allSettled([
    getDashboardStats(),
    getRecentTodos(5),
    listNotifications(5),
    listMyGroups(),
    getCurrentProfile(),
  ]);

  const stats = statsRes.status === "fulfilled" && statsRes.value 
    ? statsRes.value 
    : { totalPersonal: 0, pending: 0, overdue: 0, dueSoon: 0 };

  const recentTodos = recentTodosRes.status === "fulfilled" && Array.isArray(recentTodosRes.value) 
    ? recentTodosRes.value 
    : [];

  const recentNotifications = recentNotificationsRes.status === "fulfilled" && Array.isArray(recentNotificationsRes.value) 
    ? recentNotificationsRes.value 
    : [];

  const groups = groupsRes.status === "fulfilled" && Array.isArray(groupsRes.value) 
    ? groupsRes.value 
    : [];

  const profile = profileRes.status === "fulfilled" ? profileRes.value : null;

  const statCards = [
    { label: "Personal tasks", value: stats.totalPersonal, Icon: CheckSquare },
    { label: "Pending", value: stats.pending, Icon: Clock },
    { label: "Overdue", value: stats.overdue, Icon: AlertTriangle, warn: stats.overdue > 0 },
    { label: "Due soon", value: stats.dueSoon, Icon: CalendarClock },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your tasks and groups.</p>
        </div>
        <Button asChild>
          <Link href="/tasks">
            <Plus className="h-4 w-4" /> <span>New task</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => {
          const CardIcon = s.Icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-semibold ${s.warn ? "text-destructive" : ""}`}>{s.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${s.warn ? "bg-destructive/10" : "bg-accent"}`}>
                  <CardIcon className={`h-4 w-4 ${s.warn ? "text-destructive" : "text-accent-foreground"}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTodos.length === 0 ? (
              <EmptyState
                icon={<CheckSquare />}
                title="No tasks yet"
                description="Create your first task to get started."
                action={
                  <Button asChild size="sm">
                    <Link href="/tasks">Create a task</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentTodos.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.group?.name ? `${t.group.name} · ` : "Personal · "}
                        Updated {relativeTime(t.updated_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isOverdue(t.due_date, t.status) ? <Badge variant="destructive">Overdue</Badge> : null}
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Your groups</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/groups">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <EmptyState
                  icon={<Users />}
                  title="No groups yet"
                  description="Join or create a group to collaborate."
                  action={
                    <Button asChild size="sm" variant="outline">
                      <Link href="/groups/finder">Find groups</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {groups.slice(0, 5).map((g) => (
                    <li key={g.id}>
                      <Link href={`/groups/${g.id}`} className="flex items-center justify-between rounded-md p-2 -mx-2 hover:bg-secondary">
                        <span className="truncate text-sm font-medium">{g.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{g.member_count} members</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent notifications</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
              ) : (
                <ul className="space-y-3">
                  {recentNotifications.map((n) => (
                    <li key={n.id} className="flex items-start gap-2">
                      {!n.is_read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}