const PW_KEY = "wc2026_player_pw";

export function setPlayerSessionPassword(password: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PW_KEY, password);
}

export function getPlayerSessionPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PW_KEY);
}

export function clearPlayerSessionPassword(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PW_KEY);
}

export function playerAuthHeaders(): HeadersInit {
  const password = getPlayerSessionPassword();
  return password ? { "x-player-password": password } : {};
}
