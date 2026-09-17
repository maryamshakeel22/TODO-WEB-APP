"use client";

import * as React from "react";
import { Calendar, MoreVertical, Pencil, Trash2, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { cn, formatDate, initials, isOverdue } from "@/lib/utils";
import type { TodoWithRelations } from "@/types/domain";

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  task: TodoWithRelations;
  onToggleComplete: (task: TodoWithRelations) => void;
  onEdit: (task: TodoWithRelations) => void;
  onDelete: (task: TodoWithRelations) => void;
  onOpenDetail: (task: TodoWithRelations) => void;
}) {
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={() => onToggleComplete(task)}
        aria-label={task.status === "completed" ? "Mark as pending" : "Mark as complete"}
        className="mt-1"
      />
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpenDetail(task)}>
        <div className="flex items-center gap-2">
          <p className={cn("truncate text-sm font-medium", task.status === "completed" && "text-muted-foreground line-through")}>
            {task.title}
          </p>
        </div>
        {task.description ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
          {task.due_date ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> {formatDate(task.due_date)}
            </span>
          ) : null}
          {task.group ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {task.group.name}
            </span>
          ) : null}
          {task.assignee ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {initials(task.assignee.full_name || task.assignee.username)}
                </AvatarFallback>
              </Avatar>
              {task.assignee.username}
            </span>
          ) : null}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Task actions">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive focus:bg-destructive/10" 
            onClick={() => onDelete(task)}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}