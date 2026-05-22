import { NextRequest, NextResponse } from "next/server";
import { predictionsLocked } from "@/lib/config";
import { prisma } from "@/lib/db";
import { ALL_TEAMS } from "@/lib/teams";

const validTeams = new Set<string>(ALL_TEAMS);

function sanitizeTeam(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  return validTeams.has(v) ? v : null;
}

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const pick = await prisma.knockoutPick.findUnique({ where: { playerId } });
  return NextResponse.json({ pick });
}

export async function POST(req: NextRequest) {
  if (predictionsLocked()) {
    return NextResponse.json(
      { error: "Picks are locked — the tournament has started." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  if (!playerId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const data = {
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

  const pick = await prisma.knockoutPick.upsert({
    where: { playerId },
    create: { playerId, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true, pick });
}
