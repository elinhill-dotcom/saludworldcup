"use client";

import { useCallback, useEffect, useState } from "react";
import { joinOrResumeByName } from "@/lib/join-player";
import {
  clearStoredPlayer,
  getStoredPlayer,
  setStoredPlayer,
  type StoredPlayer,
} from "@/lib/player-storage";

export function usePlayerSession() {
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPlayer(getStoredPlayer());
    setHydrated(true);
  }, []);

  const continueAs = useCallback(async (name: string, password: string) => {
    const result = await joinOrResumeByName(name, password);
    if ("error" in result) return result;
    setPlayer(result.player);
    return result;
  }, []);

  const signOut = useCallback(() => {
    clearStoredPlayer();
    setPlayer(null);
  }, []);

  const remember = useCallback((p: StoredPlayer) => {
    setStoredPlayer(p);
    setPlayer(p);
  }, []);

  return { player, hydrated, continueAs, signOut, remember };
}
