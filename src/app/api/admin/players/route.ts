import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { predictionsLocked } from "@/lib/config";
import { prisma } from "@/lib/db";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const players = await prisma.player.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { predictions: true } },
      knockoutPick: { select: { id: true } },
    },
  });

  return NextResponse.json({
    locked: predictionsLocked(),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt.toISOString(),
      groupPicksCount: p._count.predictions,
      hasKnockoutPick: !!p.knockoutPick,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!playerId || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Invalid name or player" }, { status: 400 });
  }

  const taken = await prisma.player.findFirst({
    where: { name, NOT: { id: playerId } },
  });
  if (taken) {
    return NextResponse.json(
      { error: "That name is already taken." },
      { status: 409 },
    );
  }

  try {
    const player = await prisma.player.update({
      where: { id: playerId },
      data: { name },
    });
    return NextResponse.json({ player });
  } catch {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const playerId = req.nextUrl.searchParams.get("playerId");

  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  try {
    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = await req.json();
  if (body.action !== "clear-picks") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const playerId = body.playerId as string | undefined;
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (predictionsLocked()) {
    return NextResponse.json(
      { error: "Picks are locked — cannot clear picks after kickoff." },
      { status: 403 },
    );
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.prediction.deleteMany({
      where: { playerId, matchId: { in: [...GROUP_MATCH_IDS] } },
    }),
    prisma.knockoutPick.deleteMany({ where: { playerId } }),
  ]);

  return NextResponse.json({ ok: true });
}
