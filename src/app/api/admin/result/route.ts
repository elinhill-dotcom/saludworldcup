import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/config";
import { GROUP_MATCH_IDS, KNOCKOUT_MATCH_IDS } from "@/lib/matches-data";
import {
  fetchMatchById,
  resetMatchResult,
  updateMatchResult,
} from "@/lib/supabase-matches";
import { isSupabaseConfigured } from "@/lib/supabase";
import { toEnglishTeam } from "@/lib/team-names";

const validMatchIds = new Set([...GROUP_MATCH_IDS, ...KNOCKOUT_MATCH_IDS]);
const knockoutIds = new Set(KNOCKOUT_MATCH_IDS);

function norm(name: string): string {
  return toEnglishTeam(name.trim());
}

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password") ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const matchId = Number(body.matchId);
  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  const finished = body.finished !== false;
  const winnerRaw =
    typeof body.winnerTeam === "string" ? body.winnerTeam.trim() : "";

  if (
    !validMatchIds.has(matchId) ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const matchRes = await fetchMatchById(matchId);
  if (matchRes.error || !matchRes.data) {
    return NextResponse.json(
      { error: matchRes.error ?? "Match not found" },
      { status: 404 },
    );
  }

  const match = matchRes.data;
  let winnerTeam: string | null = null;

  if (knockoutIds.has(matchId)) {
    if (homeScore === awayScore) {
      if (!winnerRaw) {
        return NextResponse.json(
          {
            error:
              "Level after 90 minutes — select which team advanced (ET/penalties).",
          },
          { status: 400 },
        );
      }
      const w = norm(winnerRaw);
      const home = norm(match.homeTeam);
      const away = norm(match.awayTeam);
      if (w !== home && w !== away) {
        return NextResponse.json(
          { error: "Winner must be the home or away team." },
          { status: 400 },
        );
      }
      winnerTeam = w === home ? match.homeTeam : match.awayTeam;
    }
  } else if (winnerRaw) {
    return NextResponse.json(
      { error: "Winner selection is only for knockout matches." },
      { status: 400 },
    );
  }

  const res = await updateMatchResult(
    matchId,
    homeScore,
    awayScore,
    finished,
    winnerTeam,
  );
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ match: res.data });
}

export async function DELETE(req: NextRequest) {
  const password = req.headers.get("x-admin-password") ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const matchId = Number(req.nextUrl.searchParams.get("matchId"));
  if (!validMatchIds.has(matchId)) {
    return NextResponse.json({ error: "Invalid match" }, { status: 400 });
  }

  const res = await resetMatchResult(matchId);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Reset failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ match: res.data });
}
