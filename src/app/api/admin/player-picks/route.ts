import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { countKnockoutFilled, KNOCKOUT_PICK_COUNT } from "@/lib/knockout-picks";
import { fetchGroupMatchIds } from "@/lib/group-match-ids";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import { findPlayerById } from "@/lib/supabase-players";
import {
  loadGroupPredictions,
  loadKnockoutPick,
  saveGroupPredictions,
  saveKnockoutPick,
} from "@/lib/supabase-predictions";
import { isSupabaseConfigured, getSupabaseServer } from "@/lib/supabase";
import { toEnglishTeam } from "@/lib/team-names";
import { ALL_TEAMS } from "@/lib/teams";

const validTeams = new Set<string>(ALL_TEAMS);

function sanitizeTeam(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  const en = toEnglishTeam(v.trim());
  return validTeams.has(en) ? en : "";
}

function parseKnockout(body: Record<string, unknown>): KnockoutFormState {
  return {
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
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

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

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const [predsRes, koRes] = await Promise.all([
    loadGroupPredictions(playerId),
    loadKnockoutPick(playerId),
  ]);

  if (predsRes.error) {
    return NextResponse.json({ error: predsRes.error }, { status: 500 });
  }
  if (koRes.error) {
    return NextResponse.json({ error: koRes.error }, { status: 500 });
  }

  return NextResponse.json({
    player: playerRes.data,
    predictions: predsRes.data ?? [],
    knockout: koRes.data,
  });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  const items = body.predictions as
    | { matchId: number; homeScore: number; awayScore: number }[]
    | undefined;

  if (!playerId || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const knockout = parseKnockout(body);

  const [groupRes, koRes] = await Promise.all([
    saveGroupPredictions(playerId, items),
    saveKnockoutPick(playerId, knockout),
  ]);

  if (groupRes.error || !groupRes.data) {
    return NextResponse.json(
      { error: groupRes.error ?? "Group save failed" },
      { status: 500 },
    );
  }
  if (koRes.error || !koRes.data) {
    return NextResponse.json(
      { error: koRes.error ?? "Knockout save failed" },
      { status: 500 },
    );
  }

  const supabase = getSupabaseServer();
  const groupRes2 = await fetchGroupMatchIds(supabase);
  const groupTotal = groupRes2.ids.length;

  const knockoutFilled = countKnockoutFilled(koRes.data);

  if (
    groupRes.data.submittedCount > 0 &&
    groupRes.data.savedCount < groupRes.data.submittedCount
  ) {
    return NextResponse.json(
      {
        error: `Only ${groupRes.data.savedCount}/${groupRes.data.submittedCount} scores were stored. Check the match schedule in Supabase.`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    savedCount: groupRes.data.savedCount,
    submittedCount: groupRes.data.submittedCount,
    writtenCount: groupRes.data.writtenCount,
    groupPicksCount: groupRes.data.savedCount,
    groupTotal,
    knockoutFilled,
    knockoutTotal: KNOCKOUT_PICK_COUNT,
    knockout: koRes.data,
  });
}
