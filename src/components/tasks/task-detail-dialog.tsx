"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, initials, isOverdue } from "@/lib/utils";
import type { TodoWithRelations } from "@/types/domain";

export function TaskDetailDialog({
  task,
  onOpenChange,
}: {
  task: TodoWithRelations | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {task ? (
          <>
            <DialogHeader>
              <DialogTitle>{task.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                {isOverdue(task.due_date, task.status) ? <Badge variant="destructive">Overdue</Badge> : null}
                {task.group ? <Badge variant="outline">{task.group.name}</Badge> : <Badge variant="outline">Personal</Badge>}
              </div>

              {task.description ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground">No description.</p>
              )}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Created by</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={task.creator?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {initials(task.creator?.full_name || task.creator?.username)}
                      </AvatarFallback>
                    </Avatar>
                    {task.creator?.username ?? "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Assigned to</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {initials(task.assignee.full_name || task.assignee.username)}
                          </AvatarFallback>
                        </Avatar>
                        {task.assignee.username}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Due date</dt>
                  <dd className="mt-1">{task.due_date ? formatDateTime(task.due_date) : "No due date"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last updated</dt>
                  <dd className="mt-1">{formatDateTime(task.updated_at)}</dd>
                </div>
              </dl>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
