"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearChatDisplayName,
  getChatDisplayName,
  setChatDisplayName,
} from "@/lib/chat-name-storage";
import { getStoredPlayer } from "@/lib/player-storage";
import { formatCestMatchKickoff } from "@/lib/datetime";
import {
  adminFetchHeaders,
  getAdminPassword,
} from "@/lib/admin-session";
import { describeChatWindow, isMatchLive } from "@/lib/match-live";
import {
  sendChatMessage,
  subscribeToMatchChatRoom,
  unsubscribeChat,
  type ChatMessage,
  type ChatPresenceUser,
} from "@/lib/supabase-chat";
import { isSupabaseConfigured } from "@/lib/supabase";
import { MatchPoolInsight } from "@/components/MatchPoolInsight";
import type { MatchPoolStats } from "@/lib/pool-stats";

type MatchInfo = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  groupCode: string | null;
  stage: string;
};

type Props = {
  matchId: number;
};

export function LiveChatRoom({ matchId }: Props) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [live, setLive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [present, setPresent] = useState<ChatPresenceUser[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [posting, setPosting] = useState(false);
  const [adminTestMode, setAdminTestMode] = useState(false);
  const [poolInsight, setPoolInsight] = useState<MatchPoolStats | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const configured = isSupabaseConfigured();
  const sessionKeyRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Math.random()).slice(2),
  );
  const playerRef = useRef(getStoredPlayer());

  useEffect(() => {
    const stored = getChatDisplayName();
    const player = getStoredPlayer();
    playerRef.current = player;
    setDisplayName(stored);
    setNameInput(stored ?? player?.name ?? "");
    setHydrated(true);
  }, []);

  const appendMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m];
    });
  }, []);

  const loadRoom = useCallback(async () => {
    if (!configured) {
      setError("Supabase is not configured. Add env variables and restart.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/chat/${matchId}`, {
      headers: adminFetchHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not load chat");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setMatch(data.match);
    setLive(data.live);
    setAdminTestMode(Boolean(data.adminTestMode));
    setPoolInsight(data.poolInsight ?? null);
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [matchId, configured]);

  useEffect(() => {
    if (!displayName || !hydrated || !configured) return;

    loadRoom();

    const player = playerRef.current;
    const presence: ChatPresenceUser = {
      key: `${player?.id ?? displayName}:${sessionKeyRef.current}`,
      name: displayName,
      playerId: player?.id ?? null,
      at: new Date().toISOString(),
    };

    const channel = subscribeToMatchChatRoom(matchId, presence, {
      onInsert: (message) => appendMessage(message),
      onPresence: (users) => setPresent(users),
      onStatus: (status) => setConnectionStatus(status),
    });

    return () => unsubscribeChat(channel);
  }, [displayName, hydrated, matchId, configured, loadRoom, appendMessage]);

  useEffect(() => {
    if (adminTestMode) return;
    if (match?.kickoffAt) {
      setLive(isMatchLive(match.kickoffAt));
    }
  }, [match?.kickoffAt, adminTestMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function joinChat(e: React.FormEvent) {
    e.preventDefault();
    const n = nameInput.trim();
    if (n.length < 2) return;
    setChatDisplayName(n);
    setDisplayName(n);
    setError("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName) return;
    setPosting(true);
    setError("");

    const res = await sendChatMessage(
      matchId,
      displayName,
      text,
      getAdminPassword(),
    );
    setPosting(false);

    if (res.error || !res.data) {
      setError(res.error ?? "Could not send");
      return;
    }

    setText("");
    appendMessage(res.data);
  }

  if (!hydrated) {
    return <p className="text-[var(--muted)]">Loading…</p>;
  }

  if (!configured) {
    return (
      <p className="text-sm text-[var(--danger)]">
        Live chat requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.
      </p>
    );
  }

  if (!displayName) {
    return (
      <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Join live chat</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Enter your name before entering the chat. Colleagues in this room are
          watching the same match.
        </p>
        <form onSubmit={joinChat} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            className="flex-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
            required
            minLength={2}
            maxLength={80}
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
          >
            Enter chat
          </button>
        </form>
      </section>
    );
  }

  const hasFinalScore =
    match &&
    match.finished &&
    match.homeScore !== null &&
    match.awayScore !== null;
  const scoreLabel = hasFinalScore
    ? `${match.homeScore} – ${match.awayScore}`
    : "vs";

  return (
    <div className="live-chat flex flex-col gap-4 min-h-[70vh]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/live"
              className="text-xs text-[var(--muted)] hover:text-white"
            >
              ← All live matches
            </Link>
            {match && (
              <>
                <p className="text-xl font-bold mt-2">
                  {match.homeTeam}{" "}
                  <span className="text-[var(--accent)] mx-1">{scoreLabel}</span>{" "}
                  {match.awayTeam}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {formatCestMatchKickoff(match.kickoffAt)}
                  {match.groupCode ? ` · Group ${match.groupCode}` : ""}
                  {!hasFinalScore && " · Result on Results page after the match"}
                </p>
              </>
            )}
            {loading && !match && (
              <p className="text-sm text-[var(--muted)] mt-2">Loading match…</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {live ? (
              adminTestMode ? (
                <span className="live-badge">ADMIN TEST</span>
              ) : (
                <span className="live-badge">LIVE</span>
              )
            ) : (
              <span className="text-xs text-[var(--muted)]">Chat closed</span>
            )}
            <span className="text-xs text-[var(--muted)]">
              Chatting as <strong className="text-white">{displayName}</strong>
            </span>
            {connectionStatus === "SUBSCRIBED" && (
              <span className="text-xs text-green-400">Connected</span>
            )}
            {connectionStatus && connectionStatus !== "SUBSCRIBED" && (
              <span className="text-xs text-[var(--muted)]">
                {connectionStatus === "CHANNEL_ERROR"
                  ? "Reconnecting…"
                  : connectionStatus}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                clearChatDisplayName();
                setDisplayName(null);
              }}
              className="text-xs text-[var(--muted)] underline"
            >
              Change name
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted)]">
            In this room:{" "}
            <strong className="text-white">{present.length}</strong>
          </p>
          {present.length > 0 && (
            <p className="text-xs text-[var(--muted)] max-w-full truncate">
              {present.map((u) => u.name).join(", ")}
            </p>
          )}
        </div>
        {!live && (
          <p className="text-sm text-[var(--danger)] mt-3">
            {describeChatWindow().closedNotice} You can read old messages but
            cannot post new ones.
          </p>
        )}
        {adminTestMode && (
          <p className="text-sm text-amber-300/90 mt-3">
            Elin test mode — chat is open for you only; colleagues still see
            the normal schedule.
          </p>
        )}
        {poolInsight && (
          <div className="mt-3">
            <MatchPoolInsight stats={poolInsight} variant="chat" />
          </div>
        )}
      </div>

      <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col min-h-[360px]">
        <ul className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && messages.length === 0 ? (
            <li className="text-sm text-[var(--muted)] text-center py-8">
              Loading messages…
            </li>
          ) : messages.length === 0 ? (
            <li className="text-sm text-[var(--muted)] text-center py-8">
              No messages yet — say hello!
            </li>
          ) : (
            messages.map((m) => (
              <li
                key={m.id}
                className={
                  m.name === displayName
                    ? "rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 p-3 ml-4"
                    : "rounded-lg bg-[var(--bg)]/80 p-3 mr-4"
                }
              >
                <div className="flex justify-between gap-2 text-xs text-[var(--muted)] mb-1">
                  <span className="font-semibold text-[var(--accent)]">
                    {m.name}
                  </span>
                  <time>
                    {new Date(m.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {m.message}
                </p>
              </li>
            ))
          )}
          <div ref={bottomRef} />
        </ul>

        {live && (
          <form
            onSubmit={send}
            className="border-t border-[var(--border)] p-3 flex gap-2"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
              maxLength={400}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={posting || !text.trim()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
            >
              Send
            </button>
          </form>
        )}
        {error && (
          <p className="text-sm text-[var(--danger)] px-4 pb-3">{error}</p>
        )}
      </div>
    </div>
  );
}
