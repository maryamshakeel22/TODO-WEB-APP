// @ts-nocheck
/* eslint-disable */
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/domain";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

function friendlyDbError(message: string): string {
  console.error("ACTUAL DB ERROR LOGGED:", message);

  if (message.includes("todos_title_length")) {
    return "Title must be between 1 and 200 characters.";
  }
  if (message.includes("Assigned user is not a member")) {
    return "That person isn't a member of this group.";
  }
  if (message.includes("Creator is not a member")) {
    return "You're not a member of this group.";
  }

  // Exact raw message return karein taake generic error masking na ho
  return `Database Error: ${message}`;
}

function normalizeAssignee(value: FormDataEntryValue | null): string | null {
  const str = (value as string) || "";
  if (!str || str === "unassigned") return null;
  return str;
}

const todoSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  dueDate: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
});

export async function createTodoAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = todoSchema.safeParse({
    title: formData.get("title"),
    description: (formData.get("description") as string) || null,
    priority: (formData.get("priority") as string) || "medium",
    status: (formData.get("status") as string) || "pending",
    dueDate: (formData.get("dueDate") as string) || null,
    groupId: (formData.get("groupId") as string) || null,
    assignedTo: normalizeAssignee(formData.get("assignedTo")),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "You must be signed in." };

  const insert: TablesInsert<"todos"> = {
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    status: parsed.data.status,
    due_date: parsed.data.dueDate ? new Date(parsed.data.dueDate).toISOString() : null,
    group_id: parsed.data.groupId || null,
    assigned_to: parsed.data.assignedTo || user.id,
    creator_id: user.id,
  };

  const { data, error } = await supabase.from("todos").insert(insert).select("id").single();
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (parsed.data.groupId) revalidatePath(`/groups/${parsed.data.groupId}`);
  return { success: true, data: { id: data.id } };
}

const updateSchema = todoSchema.partial().extend({ id: z.string().uuid() });

export async function updateTodoAction(formData: FormData): Promise<ActionResult> {
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") || undefined,
    description: formData.has("description") ? (formData.get("description") as string) || null : undefined,
    priority: (formData.get("priority") as string) || undefined,
    status: (formData.get("status") as string) || undefined,
    dueDate: formData.has("dueDate") ? (formData.get("dueDate") as string) || null : undefined,
    assignedTo: formData.has("assignedTo") ? normalizeAssignee(formData.get("assignedTo")) : undefined,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]!.message };
  const supabase = await createClient();

  const update: TablesUpdate<"todos"> = {};
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.description !== undefined) update.description = parsed.data.description;
  if (parsed.data.priority !== undefined) update.priority = parsed.data.priority;
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.dueDate !== undefined) {
    update.due_date = parsed.data.dueDate ? new Date(parsed.data.dueDate).toISOString() : null;
  }
  if (parsed.data.assignedTo !== undefined) update.assigned_to = parsed.data.assignedTo;

  const { data: existing } = await supabase.from("todos").select("group_id").eq("id", parsed.data.id).single();

  const { error } = await supabase.from("todos").update(update).eq("id", parsed.data.id);
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (existing?.group_id) revalidatePath(`/groups/${existing.group_id}`);
  return { success: true, data: undefined };
}

export async function setTodoStatusAction(id: string, status: "pending" | "in_progress" | "completed"): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("todos").select("group_id").eq("id", id).single();
  const { error } = await supabase.from("todos").update({ status }).eq("id", id);
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (existing?.group_id) revalidatePath(`/groups/${existing.group_id}`);
  return { success: true, data: undefined };
}

export async function deleteTodoAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("todos").select("group_id").eq("id", id).single();
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) return { success: false, error: friendlyDbError(error.message) };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (existing?.group_id) revalidatePath(`/groups/${existing.group_id}`);
  return { success: true, data: undefined };
}