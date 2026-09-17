"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function useTableRealtime(
  channelName: string,
  table: string,
  filter: string | undefined,
  onEvent?: (payload: unknown) => void
) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const onEventRef = useRef(onEvent);

  // Keep callback reference updated without triggering re-subscribes
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!filter) return;

    // Unique runtime channel name to prevent race condition crashes
    const uniqueName = `${channelName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const channel = supabase.channel(uniqueName);

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => {
          onEventRef.current?.(payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(`Realtime channel error on table: ${table}`);
        }
      });

    return () => {
      // Clean up connection properly
      supabase.removeChannel(channel);
    };
  }, [filter, channelName, table, supabase, router]);
}

/** Refresh personal task views when the signed-in user's own todos change. */
export function useRealtimePersonalTodos(userId: string | undefined) {
  useTableRealtime(
    `personal-todos`,
    "todos",
    userId ? `creator_id=eq.${userId}` : undefined
  );
}

/** Refresh a group's task board when any todo in that group changes. */
export function useRealtimeGroupTodos(groupId: string | undefined) {
  useTableRealtime(
    `group-todos`,
    "todos",
    groupId ? `group_id=eq.${groupId}` : undefined
  );
}

/** Refresh group membership UI (member list, roles) for a specific group. */
export function useRealtimeGroupMembers(groupId: string | undefined) {
  useTableRealtime(
    `group-members`,
    "group_members",
    groupId ? `group_id=eq.${groupId}` : undefined
  );
}

/** Refresh + optionally toast when the signed-in user gets a new notification. */
export function useRealtimeNotifications(
  userId: string | undefined,
  onInsert?: () => void
) {
  useTableRealtime(
    `notifications`,
    "notifications",
    userId ? `user_id=eq.${userId}` : undefined,
    (payload) => {
      const p = payload as { eventType: string };
      if (p.eventType === "INSERT") onInsert?.();
    }
  );
}

/** Refresh invitations received by the signed-in user. */
export function useRealtimeInvitations(userId: string | undefined) {
  useTableRealtime(
    `invitations`,
    "group_invitations",
    userId ? `invitee_id=eq.${userId}` : undefined
  );
}