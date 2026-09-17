"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { NotificationItem } from "@/components/notifications/notification-item";
import { 
  markAllNotificationsReadAction, 
  markNotificationReadAction,
  deleteNotificationAction 
} from "@/lib/actions/notifications";
import { useRealtimeNotifications } from "@/hooks/use-realtime";
import type { NotificationWithActor } from "@/types/domain";

export function NotificationsList({
  notifications,
  userId,
}: {
  notifications: NotificationWithActor[];
  userId?: string;
}) {
  const router = useRouter();
  const [markingAll, setMarkingAll] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  useRealtimeNotifications(userId);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id);
    router.refresh();
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    const result = await markAllNotificationsReadAction();
    setMarkingAll(false);
    if (!result.success) toast.error(result.error);
    else router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteNotificationAction(id);
    setDeletingId(null);

    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Notification deleted");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        </p>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" onClick={handleMarkAll} loading={markingAll}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Activity on your tasks and groups will show up here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem 
              key={n.id} 
              notification={n} 
              onMarkRead={handleMarkRead}
              onDelete={() => handleDelete(n.id)}
              isDeleting={deletingId === n.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}