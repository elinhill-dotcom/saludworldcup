import { NextRequest, NextResponse } from "next/server";
import { findOrCreatePlayerByName, fetchPlayers } from "@/lib/supabase-players";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name : "";

  const res = await findOrCreatePlayerByName(name);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Could not register" },
      { status: res.error?.includes("2–80") ? 400 : 500 },
    );
  }

  return NextResponse.json({ player: res.data });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const res = await fetchPlayers();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load players" },
      { status: 500 },
    );
  }

  return NextResponse.json({ players: res.data });
}
