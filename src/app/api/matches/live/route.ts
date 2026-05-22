import { NextResponse } from "next/server";
import { fetchLiveMatches } from "@/lib/supabase-matches";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ live: [], count: 0 });
  }

  const res = await fetchLiveMatches();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load live matches" },
      { status: 500 },
    );
  }

  return NextResponse.json({ live: res.data, count: res.data.length });
}
