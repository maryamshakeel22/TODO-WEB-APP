"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function useTableRealtime(
  channelName: string,
  table: string,
  filter: string | undefined,
  onEvent?: (payload: unknown) => void
) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!filter) return;

    const channelId = `realtime-${channelName}-${table}-${filter}`;
    
    // Agar pehle se same channel ID ka instance ho to clean karein
    const existingChannel = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelId}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    // Always attach .on() listener BEFORE calling .subscribe()
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        (payload) => {
          onEventRef.current?.(payload);
          router.refresh();
        }
      );

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.warn(`Realtime channel error on table: ${table}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, channelName, table, supabase, router]);
}

export function useRealtimePersonalTodos(userId: string | undefined) {
  useTableRealtime(
    `personal-todos`,
    "todos",
    userId ? `creator_id=eq.${userId}` : undefined
  );
}

export function useRealtimeGroupTodos(groupId: string | undefined) {
  useTableRealtime(
    `group-todos`,
    "todos",
    groupId ? `group_id=eq.${groupId}` : undefined
  );
}

export function useRealtimeGroupMembers(groupId: string | undefined) {
  useTableRealtime(
    `group-members`,
    "group_members",
    groupId ? `group_id=eq.${groupId}` : undefined
  );
}

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

export function useRealtimeInvitations(userId: string | undefined) {
  useTableRealtime(
    `invitations`,
    "group_invitations",
    userId ? `invitee_id=eq.${userId}` : undefined
  );
}