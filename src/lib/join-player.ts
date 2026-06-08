import { clearAdminSession } from "./admin-session";
import { setStoredPlayer, type StoredPlayer } from "./player-storage";
import { setPlayerSessionPassword } from "./player-session-storage";

export async function joinOrResumeByName(
  name: string,
  password: string,
): Promise<{ player: StoredPlayer } | { error: string }> {
  const trimmed = name.trim();
  const res = await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error ?? "Something went wrong" };
  }
  const player = data.player as StoredPlayer;
  clearAdminSession();
  setStoredPlayer(player);
  setPlayerSessionPassword(password);
  return { player };
}

export async function lookupPlayerName(
  name: string,
): Promise<{ exists: boolean; hasPassword: boolean } | { error: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { exists: false, hasPassword: false };
  }
  const res = await fetch(
    `/api/players/lookup?name=${encodeURIComponent(trimmed)}`,
  );
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error ?? "Lookup failed" };
  }
  return {
    exists: data.exists ?? false,
    hasPassword: data.hasPassword ?? false,
  };
}
