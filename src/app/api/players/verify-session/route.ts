import { NextRequest, NextResponse } from "next/server";
import { verifyStoredPlayerSession } from "@/lib/supabase-players";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!playerId || !password) {
    return NextResponse.json({ valid: false });
  }

  const res = await verifyStoredPlayerSession(playerId, password);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  if (!res.data?.valid) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, player: res.data.player });
}
