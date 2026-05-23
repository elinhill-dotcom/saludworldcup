import { isMatchLive } from "@/lib/match-live";
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
        "Live chat is closed. It opens 15 minutes before kickoff and closes 2 hours after kickoff.",
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

export function unsubscribeChat(channel: RealtimeChannel) {
  const supabase = getSupabaseBrowser();
  supabase.removeChannel(channel);
}
