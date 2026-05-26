const PW_KEY = "wc2026_admin_pw";
const VERIFIED_KEY = "wc2026_admin_verified";

/** Same key the admin page uses — exported for backward compat. */
export const ADMIN_SESSION_KEY = PW_KEY;

export function getAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PW_KEY);
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(VERIFIED_KEY) === "1" && Boolean(getAdminPassword());
}

export function setAdminSession(password: string): void {
  sessionStorage.setItem(PW_KEY, password);
  sessionStorage.setItem(VERIFIED_KEY, "1");
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(PW_KEY);
  sessionStorage.removeItem(VERIFIED_KEY);
}

export function adminFetchHeaders(): HeadersInit {
  const pw = getAdminPassword();
  return pw ? { "x-admin-password": pw } : {};
}

export async function verifyAndLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Wrong password" };
    }
    setAdminSession(password);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach server" };
  }
}
