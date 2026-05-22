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

type ChatMessage = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

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
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getChatDisplayName();
    const player = getStoredPlayer();
    setDisplayName(stored);
    setNameInput(stored ?? player?.name ?? "");
    setHydrated(true);
  }, []);

  const lastFetchedAt = useRef<string | null>(null);
  const initialLoad = useRef(true);

  const poll = useCallback(async () => {
    const since = lastFetchedAt.current
      ? `?since=${encodeURIComponent(lastFetchedAt.current)}`
      : "";
    const res = await fetch(`/api/chat/${matchId}${since}`);
    if (!res.ok) return;
    const data = await res.json();
    setMatch(data.match);
    setLive(data.live);

    const incoming: ChatMessage[] = data.messages ?? [];
    if (initialLoad.current) {
      setMessages(incoming);
      initialLoad.current = false;
    } else if (incoming.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const added = incoming.filter((m) => !ids.has(m.id));
        return added.length ? [...prev, ...added] : prev;
      });
    }
    if (incoming.length > 0) {
      lastFetchedAt.current = incoming[incoming.length - 1].createdAt;
    }
  }, [matchId]);

  useEffect(() => {
    if (!displayName || !hydrated) return;
    initialLoad.current = true;
    lastFetchedAt.current = null;
    poll();
    const id = setInterval(poll, 2500);
    return () => clearInterval(id);
  }, [displayName, hydrated, poll]);

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
    const res = await fetch(`/api/chat/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: displayName, message: text }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send");
      return;
    }
    setText("");
    setMessages((prev) => [...prev, data.message]);
  }

  if (!hydrated) {
    return <p className="text-[var(--muted)]">Loading…</p>;
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
          </div>
          <div className="flex flex-col items-end gap-2">
            {live ? (
              <span className="live-badge">LIVE</span>
            ) : (
              <span className="text-xs text-[var(--muted)]">Chat closed</span>
            )}
            <span className="text-xs text-[var(--muted)]">
              Chatting as <strong className="text-white">{displayName}</strong>
            </span>
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
        {!live && (
          <p className="text-sm text-[var(--danger)] mt-3">
            Chat is closed (opens 15 min before, closes 2 h after kickoff). You
            can read old messages but cannot post new ones.
          </p>
        )}
      </div>

      <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col min-h-[360px]">
        <ul className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
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
