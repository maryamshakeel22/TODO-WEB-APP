import { createClient } from "@/lib/supabase/server";
import { listTodos, type TodoFilter, type TodoSort } from "@/lib/data/todos";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; priority?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tasks = await listTodos({
    scope: "personal",
    search: params.q,
    filter: (params.filter as TodoFilter) ?? "all",
    priority: (params.priority as "low" | "medium" | "high" | "all") ?? "all",
    sort: (params.sort as TodoSort) ?? "newest",
  });

  const hasActiveFilters = Boolean(params.q || (params.filter && params.filter !== "all") || (params.priority && params.priority !== "all"));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My Tasks</h2>
        <p className="text-sm text-muted-foreground">Personal tasks only you can see.</p>
      </div>
      <TaskFilters />
      <TaskList tasks={tasks} userId={user?.id} hasActiveFilters={hasActiveFilters} emptyLabel="No personal tasks yet" />
    </div>
  );
}
