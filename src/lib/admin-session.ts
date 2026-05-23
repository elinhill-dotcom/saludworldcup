/** Session key for admin password (set on /admin after login). */
export const ADMIN_SESSION_KEY = "wc2026_admin_pw";

export function getAdminPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_SESSION_KEY);
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminPassword());
}

export function adminFetchHeaders(): HeadersInit {
  const pw = getAdminPassword();
  return pw ? { "x-admin-password": pw } : {};
}
