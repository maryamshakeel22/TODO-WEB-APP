"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ConfirmDialog } from "@/components/ui/states";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { deleteTodoAction, setTodoStatusAction } from "@/lib/actions/todos";
import { useRealtimeGroupTodos, useRealtimePersonalTodos } from "@/hooks/use-realtime";
import type { GroupMemberWithProfile, TodoWithRelations } from "@/types/domain";

export function TaskList({
  tasks,
  userId,
  groupId,
  groupMembers,
  hasActiveFilters,
  emptyLabel = "No tasks yet",
  canCreate = true,
}: {
  tasks: TodoWithRelations[];
  userId?: string;
  groupId?: string;
  groupMembers?: GroupMemberWithProfile[];
  hasActiveFilters?: boolean;
  emptyLabel?: string;
  canCreate?: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<TodoWithRelations | null>(null);
  const [detailTask, setDetailTask] = React.useState<TodoWithRelations | null>(null);
  const [deletingTask, setDeletingTask] = React.useState<TodoWithRelations | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  useRealtimeGroupTodos(groupId);
  useRealtimePersonalTodos(groupId ? undefined : userId);

  async function handleToggleComplete(task: TodoWithRelations) {
    const next = task.status === "completed" ? "pending" : "completed";
    const result = await setTodoStatusAction(task.id, next);
    if (!result.success) toast.error(result.error);
    else router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deletingTask) return;
    setDeleting(true);
    const result = await deleteTodoAction(deletingTask.id);
    setDeleting(false);
    setDeletingTask(null);
    if (!result.success) toast.error(result.error);
    else {
      toast.success("Task deleted");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New task
          </Button>
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-6 w-6 text-muted-foreground" aria-hidden />}
          title={hasActiveFilters ? "No tasks match your filters" : emptyLabel}
          description={hasActiveFilters ? "Try adjusting your search or filters." : "Create a task to get started."}
          action={
            !hasActiveFilters && canCreate ? (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                Create a task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={(t) => {
                setEditingTask(t);
                setFormOpen(true);
              }}
              onDelete={(t) => setDeletingTask(t)}
              onOpenDetail={(t) => setDetailTask(t)}
            />
          ))}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        groupId={groupId}
        groupMembers={groupMembers}
        onSaved={() => router.refresh()}
      />

      <TaskDetailDialog task={detailTask} onOpenChange={(open) => !open && setDetailTask(null)} />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title="Delete this task?"
        description={`"${deletingTask?.title ?? ""}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}