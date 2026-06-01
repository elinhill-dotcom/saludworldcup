import { describeChatWindow, isMatchLive } from "@/lib/match-live";
import { mapChatMessage } from "@/lib/supabase-mappers";
import type { ChatMessageRow } from "@/lib/supabase-types";
import {
  getSupabaseBrowser,
  getSupabaseServer,
  toErrorMessage,
  type DbResult,
} from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { fetchMatchById } from "@/lib/supabase-matches";

export type ChatMessage = ReturnType<typeof mapChatMessage>;

export type ChatPresenceUser = {
  /** Stable-ish identifier for this browser session. */
  key: string;
  /** Display name shown in the room. */
  name: string;
  /** Optional playerId from localStorage session. */
  playerId?: string | null;
  /** ISO time when presence was tracked. */
  at?: string;
};

export async function loadChatMessages(
  matchId: number,
  since?: string,
  browser = false,
): Promise<DbResult<ChatMessage[]>> {
  try {
    const supabase = browser ? getSupabaseBrowser() : getSupabaseServer();
    let q = supabase
      .from("match_chat_messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .limit(since ? 100 : 150);

    if (since) {
      q = q.gt("created_at", since);
    }

    const { data, error } = await q;
    if (error) return { data: null, error: error.message };
    return {
      data: (data as ChatMessageRow[]).map(mapChatMessage),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

function validateChatInput(
  name: string,
  message: string,
): { name: string; message: string } | { error: string } {
  const trimmedName = name.trim();
  const trimmedMsg = message.trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    return { error: "Enter a valid name." };
  }
  if (trimmedMsg.length < 1 || trimmedMsg.length > 400) {
    return { error: "Message must be 1–400 characters." };
  }
  return { name: trimmedName, message: trimmedMsg };
}

export async function insertChatMessage(
  matchId: number,
  name: string,
  message: string,
  opts?: { skipLiveCheck?: boolean; browser?: boolean },
): Promise<DbResult<ChatMessage>> {
  const matchRes = await fetchMatchById(matchId, opts?.browser ?? false);
  if (matchRes.error || !matchRes.data) {
    return { data: null, error: matchRes.error ?? "Match not found" };
  }
  if (!opts?.skipLiveCheck && !isMatchLive(matchRes.data.kickoffAt)) {
    return {
      data: null,
      error:
        describeChatWindow().apiError,
    };
  }

  const validated = validateChatInput(name, message);
  if ("error" in validated) {
    return { data: null, error: validated.error };
  }

  try {
    const supabase =
      opts?.browser === true ? getSupabaseBrowser() : getSupabaseServer();
    const { data, error } = await supabase
      .from("match_chat_messages")
      .insert({
        match_id: matchId,
        name: validated.name,
        message: validated.message,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapChatMessage(data as ChatMessageRow), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function sendChatMessage(
  matchId: number,
  name: string,
  message: string,
  adminPassword?: string | null,
): Promise<DbResult<ChatMessage>> {
  if (adminPassword) {
    try {
      const res = await fetch(`/api/chat/${matchId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: data.error ?? "Could not send" };
      }
      return { data: data.message as ChatMessage, error: null };
    } catch (e) {
      return { data: null, error: toErrorMessage(e) };
    }
  }

  return insertChatMessage(matchId, name, message, { browser: true });
}

/** Subscribe to new messages for a match (realtime). */
export function subscribeToMatchChat(
  matchId: number,
  onInsert: (message: ChatMessage) => void,
  onStatus?: (status: string) => void,
): RealtimeChannel {
  const supabase = getSupabaseBrowser();

  const channel = supabase
    .channel(`match-chat-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "match_chat_messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (payload.new) {
          onInsert(mapChatMessage(payload.new as ChatMessageRow));
        }
      },
    )
    .subscribe((status) => {
      onStatus?.(status);
    });

  return channel;
}

function presenceUsersFromChannel(channel: RealtimeChannel): ChatPresenceUser[] {
  // presenceState(): { [key: string]: Array<PresencePayload> }
  // Where each payload is whatever was passed to track().
  const state = channel.presenceState() as Record<string, ChatPresenceUser[]>;
  const users: ChatPresenceUser[] = [];
  for (const key of Object.keys(state)) {
    for (const meta of state[key] ?? []) {
      users.push({
        key,
        name: meta?.name ?? "Anonymous",
        playerId: meta?.playerId ?? null,
        at: meta?.at,
      });
    }
  }

  // De-duplicate by key; if multiple metas exist, keep the newest-ish one.
  const byKey = new Map<string, ChatPresenceUser>();
  for (const u of users) byKey.set(u.key, u);
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/**
 * Subscribe to a match chat room with Supabase Realtime Presence:
 * lets the UI show who's currently in the room.
 */
export function subscribeToMatchChatRoom(
  matchId: number,
  presence: ChatPresenceUser,
  handlers: {
    onInsert: (message: ChatMessage) => void;
    onPresence: (users: ChatPresenceUser[]) => void;
    onStatus?: (status: string) => void;
  },
): RealtimeChannel {
  const supabase = getSupabaseBrowser();

  const channel = supabase
    .channel(`match-chat-${matchId}`, {
      config: {
        presence: { key: presence.key },
      },
    })
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "match_chat_messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (payload.new) {
          handlers.onInsert(mapChatMessage(payload.new as ChatMessageRow));
        }
      },
    )
    .on("presence", { event: "sync" }, () => {
      handlers.onPresence(presenceUsersFromChannel(channel));
    })
    .on("presence", { event: "join" }, () => {
      handlers.onPresence(presenceUsersFromChannel(channel));
    })
    .on("presence", { event: "leave" }, () => {
      handlers.onPresence(presenceUsersFromChannel(channel));
    })
    .subscribe(async (status) => {
      handlers.onStatus?.(status);
      if (status === "SUBSCRIBED") {
        // Track this user into the room.
        await channel.track({
          key: presence.key,
          name: presence.name,
          playerId: presence.playerId ?? null,
          at: new Date().toISOString(),
        } satisfies ChatPresenceUser);
      }
    });

  return channel;
}

export function unsubscribeChat(channel: RealtimeChannel) {
  const supabase = getSupabaseBrowser();
  supabase.removeChannel(channel);
}
