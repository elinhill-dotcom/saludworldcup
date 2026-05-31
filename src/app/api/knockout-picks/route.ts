import { NextRequest, NextResponse } from "next/server";
import { predictionsLocked } from "@/lib/config";
import { canReadPlayerData } from "@/lib/player-auth";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import { findPlayerById } from "@/lib/supabase-players";
import {
  loadKnockoutPick,
  saveKnockoutPick,
} from "@/lib/supabase-predictions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ALL_TEAMS } from "@/lib/teams";

const validTeams = new Set<string>(ALL_TEAMS);

function sanitizeTeam(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  return validTeams.has(v) ? v : "";
}

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const password = req.headers.get("x-player-password");
  const access = await canReadPlayerData(playerId, password);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: 500 });
  }
  if (!access.data) {
    return NextResponse.json(
      { error: "Picks are hidden until 11 June at 20:00 — log in to see your own." },
      { status: 403 },
    );
  }

  const res = await loadKnockoutPick(playerId);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  return NextResponse.json({ pick: res.data });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  if (predictionsLocked()) {
    return NextResponse.json(
      { error: "Picks are locked — no bets after 11 June at 20:00." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  if (!playerId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const form: KnockoutFormState = {
    sf1Home: sanitizeTeam(body.sf1Home),
    sf1Away: sanitizeTeam(body.sf1Away),
    sf2Home: sanitizeTeam(body.sf2Home),
    sf2Away: sanitizeTeam(body.sf2Away),
    finalHome: sanitizeTeam(body.finalHome),
    finalAway: sanitizeTeam(body.finalAway),
    bronzeHome: sanitizeTeam(body.bronzeHome),
    bronzeAway: sanitizeTeam(body.bronzeAway),
    champion: sanitizeTeam(body.champion),
  };

  const saveRes = await saveKnockoutPick(playerId, form);
  if (saveRes.error || !saveRes.data) {
    return NextResponse.json(
      { error: saveRes.error ?? "Save failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, pick: saveRes.data });
}
