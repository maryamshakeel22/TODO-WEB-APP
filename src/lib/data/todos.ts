import { createClient } from "@/lib/supabase/server";
import type { TodoWithRelations } from "@/types/domain";

export type TodoFilter = "all" | "active" | "completed" | "overdue";
export type TodoSort = "newest" | "oldest" | "due_date" | "priority" | "updated";

export interface ListTodosParams {
  scope: "personal" | { groupId: string };
  search?: string;
  filter?: TodoFilter;
  priority?: "low" | "medium" | "high" | "all";
  sort?: TodoSort;
}

const TODO_SELECT =
  "*, creator:profiles!todos_creator_id_fkey(id, username, full_name, avatar_url), assignee:profiles!todos_assigned_to_fkey(id, username, full_name, avatar_url), group:groups(id, name)";

export async function listTodos(params: ListTodosParams): Promise<TodoWithRelations[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase.from("todos").select(TODO_SELECT);

  if (params.scope === "personal") {
    query = query.is("group_id", null).eq("creator_id", user.id);
  } else {
    query = query.eq("group_id", params.scope.groupId);
  }

  if (params.search && params.search.trim()) {
    // Strip SQL LIKE wildcards (%, _) and PostgREST filter-syntax
    // characters (,()."*) so a crafted search term can only ever
    // narrow the match, never restructure the .or() filter itself.
    const term = params.search.trim().slice(0, 100).replace(/[%_,()."*\\]/g, "");
    if (term) {
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
  }

  if (params.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority);
  }

  switch (params.filter) {
    case "active":
      query = query.in("status", ["pending", "in_progress"]);
      break;
    case "completed":
      query = query.eq("status", "completed");
      break;
    case "overdue":
      query = query
        .lt("due_date", new Date().toISOString())
        .neq("status", "completed")
        .not("due_date", "is", null);
      break;
    default:
      break;
  }

  switch (params.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "due_date":
      query = query.order("due_date", { ascending: true, nullsFirst: false });
      break;
    case "priority":
      // priority is an enum; order alphabetically desc puts "medium" before others,
      // so we fetch then sort client-side for a true high->low->medium ordering.
      query = query.order("created_at", { ascending: false });
      break;
    case "updated":
      query = query.order("updated_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(200);
  if (error || !data) return [];

  let rows = data as unknown as TodoWithRelations[];

  if (params.sort === "priority") {
    const order = { high: 0, medium: 1, low: 2 };
    rows = [...rows].sort((a, b) => order[a.priority] - order[b.priority]);
  }

  return rows;
}

export async function getTodoById(id: string): Promise<TodoWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("todos").select(TODO_SELECT).eq("id", id).single();
  if (error || !data) return null;
  return data as unknown as TodoWithRelations;
}

export interface DashboardStats {
  totalPersonal: number;
  completed: number;
  pending: number;
  overdue: number;
  dueSoon: number;
  groupCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { totalPersonal: 0, completed: 0, pending: 0, overdue: 0, dueSoon: 0, groupCount: 0 };
  }

  const nowIso = new Date().toISOString();
  const soonIso = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const [total, completed, pending, overdue, dueSoon, groups] = await Promise.all([
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .is("group_id", null),
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .is("group_id", null)
      .eq("status", "completed"),
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .is("group_id", null)
      .neq("status", "completed"),
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .is("group_id", null)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .lt("due_date", nowIso),
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .is("group_id", null)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .gte("due_date", nowIso)
      .lte("due_date", soonIso),
    supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    totalPersonal: total.count ?? 0,
    completed: completed.count ?? 0,
    pending: pending.count ?? 0,
    overdue: overdue.count ?? 0,
    dueSoon: dueSoon.count ?? 0,
    groupCount: groups.count ?? 0,
  };
}

export async function getRecentTodos(limit = 5): Promise<TodoWithRelations[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("todos")
    .select(TODO_SELECT)
    .or(`creator_id.eq.${user.id},assigned_to.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as unknown as TodoWithRelations[];
}
