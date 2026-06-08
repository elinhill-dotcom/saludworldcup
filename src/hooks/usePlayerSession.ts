"use client";

import { useCallback, useEffect, useState } from "react";
import { joinOrResumeByName } from "@/lib/join-player";
import {
  clearStoredPlayer,
  getStoredPlayer,
  setStoredPlayer,
  type StoredPlayer,
} from "@/lib/player-storage";
import {
  clearPlayerSessionPassword,
  getPlayerSessionPassword,
} from "@/lib/player-session-storage";

export function usePlayerSession() {
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = getStoredPlayer();
      const password = getPlayerSessionPassword();

      if (!stored || !password) {
        if (stored && !password) clearStoredPlayer();
        if (!cancelled) {
          setPlayer(null);
          setHydrated(true);
        }
        return;
      }

      try {
        const res = await fetch("/api/players/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: stored.id, password }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.valid) {
          clearStoredPlayer();
          clearPlayerSessionPassword();
          setPlayer(null);
        } else {
          const p = (data.player as StoredPlayer | undefined) ?? stored;
          setStoredPlayer(p);
          setPlayer(p);
        }
      } catch {
        if (!cancelled) {
          clearStoredPlayer();
          clearPlayerSessionPassword();
          setPlayer(null);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const continueAs = useCallback(async (name: string, password: string) => {
    const result = await joinOrResumeByName(name, password);
    if ("error" in result) return result;
    setPlayer(result.player);
    return result;
  }, []);

  const signOut = useCallback(() => {
    clearStoredPlayer();
    clearPlayerSessionPassword();
    setPlayer(null);
  }, []);

  const remember = useCallback((p: StoredPlayer) => {
    setStoredPlayer(p);
    setPlayer(p);
  }, []);

  return { player, hydrated, continueAs, signOut, remember };
}
