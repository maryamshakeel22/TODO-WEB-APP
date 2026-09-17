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
  // Singleton client instance keep karein
  const [supabase] = useState(() => createClient());
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!filter) return;

    // Fixed stable name - No Date.now() or Math.random()
    const channelId = `realtime-${channelName}-${table}-${filter}`;
    const channel = supabase.channel(channelId);

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