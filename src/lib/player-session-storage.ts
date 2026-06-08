const PW_KEY = "wc2026_player_pw";

/** Device-local password so picks reload after browser restart (paired with localStorage player). */
export function setPlayerSessionPassword(password: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PW_KEY, password);
}

export function getPlayerSessionPassword(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = localStorage.getItem(PW_KEY);
  if (fromLocal) return fromLocal;
  const legacy = sessionStorage.getItem(PW_KEY);
  if (legacy) {
    localStorage.setItem(PW_KEY, legacy);
    sessionStorage.removeItem(PW_KEY);
    return legacy;
  }
  return null;
}

export function clearPlayerSessionPassword(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PW_KEY);
  // Legacy: clear old sessionStorage key if present
  sessionStorage.removeItem(PW_KEY);
}

export function playerAuthHeaders(): HeadersInit {
  const password = getPlayerSessionPassword();
  return password ? { "x-player-password": password } : {};
}
