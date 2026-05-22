const KEY = "wc2026_chat_name";

export function getChatDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setChatDisplayName(name: string): void {
  localStorage.setItem(KEY, name.trim());
}

export function clearChatDisplayName(): void {
  localStorage.removeItem(KEY);
}
