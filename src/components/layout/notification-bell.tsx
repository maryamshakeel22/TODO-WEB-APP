"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRealtimeNotifications } from "@/hooks/use-realtime";

export function NotificationBell({ userId, unreadCount }: { userId: string | undefined; unreadCount: number }) {
  useRealtimeNotifications(userId, () => {
    toast.info("You have a new notification");
  });

  return (
    <Button variant="ghost" size="icon" className="relative" asChild aria-label={`Notifications, ${unreadCount} unread`}>
      <Link href="/notifications">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
