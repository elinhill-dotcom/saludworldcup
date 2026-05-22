import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function requireEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return { url, key };
}

let browserClient: SupabaseClient | null = null;

/** Browser client — predictions, matches, chat realtime. */
export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowser() is for client components only");
  }
  if (!browserClient) {
    const { url, key } = requireEnv();
    browserClient = createClient(url, key);
  }
  return browserClient;
}

/** Server / API routes (same anon key, no Supabase Auth). */
export function getSupabaseServer(): SupabaseClient {
  const { url, key } = requireEnv();
  return createClient(url, key);
}

export function toErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  return "Something went wrong";
}
