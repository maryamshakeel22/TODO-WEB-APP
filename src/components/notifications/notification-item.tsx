"use client";

import Link from "next/link";
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  ClipboardList,
  Users,
  Clock,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NotificationType, NotificationWithActor } from "@/types/domain";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  group_invitation: UserPlus,
  invitation_accepted: CheckCircle2,
  invitation_rejected: XCircle,
  group_joined: Users,
  task_assigned: ClipboardList,
  task_unassigned: ClipboardList,
  task_completed: ClipboardCheck,
  task_due_soon: Clock,
};

function notificationHref(n: NotificationWithActor): string {
  if (n.related_group_id) return `/groups/${n.related_group_id}`;
  if (n.related_todo_id) return "/tasks";
  return "/notifications";
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isDeleting = false,
}: {
  notification: NotificationWithActor;
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}) {
  const Icon = TYPE_ICON[notification.type] ?? ClipboardList;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Permission Check Before Delete
    const confirmed = window.confirm("Are you sure you want to delete this notification?");
    if (confirmed && onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/50",
        notification.is_read ? "border-border" : "border-primary/30 bg-accent/40"
      )}
    >
      <Link
        href={notificationHref(notification)}
        onClick={() => !notification.is_read && onMarkRead(notification.id)}
        className="flex flex-1 items-start gap-3 min-w-0"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
          <Icon className="h-4 w-4 text-accent-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{notification.title}</p>
          {notification.message ? (
            <p className="text-sm text-muted-foreground">{notification.message}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {relativeTime(notification.created_at)}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        {!notification.is_read ? (
          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
        ) : null}

        {onDelete ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            disabled={isDeleting}
            onClick={handleDeleteClick}
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}