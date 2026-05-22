import { NextRequest, NextResponse } from "next/server";
import { isMatchLive } from "@/lib/match-live";
import { prisma } from "@/lib/db";

const MAX_MESSAGE = 400;
const MAX_NAME = 80;

type RouteCtx = { params: Promise<{ matchId: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { matchId: raw } = await ctx.params;
  const matchId = Number(raw);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "Invalid match" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const since = req.nextUrl.searchParams.get("since");
  const sinceDate = since ? new Date(since) : null;

  const messages = await prisma.matchChatMessage.findMany({
    where: {
      matchId,
      ...(sinceDate && !Number.isNaN(sinceDate.getTime())
        ? { createdAt: { gt: sinceDate } }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    take: sinceDate ? 100 : 150,
  });

  return NextResponse.json({
    match: {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickoffAt: match.kickoffAt.toISOString(),
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      finished: match.finished,
      groupCode: match.groupCode,
      stage: match.stage,
    },
    live: isMatchLive(match.kickoffAt),
    messages,
  });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { matchId: raw } = await ctx.params;
  const matchId = Number(raw);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "Invalid match" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (!isMatchLive(match.kickoffAt)) {
    return NextResponse.json(
      {
        error:
          "Live chat is closed. It opens 15 minutes before kickoff and closes 2 hours after kickoff.",
      },
      { status: 403 },
    );
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > MAX_NAME) {
    return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
  }
  if (message.length < 1 || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Message must be 1–${MAX_MESSAGE} characters.` },
      { status: 400 },
    );
  }

  const created = await prisma.matchChatMessage.create({
    data: { matchId, name, message },
  });

  return NextResponse.json({ message: created }, { status: 201 });
}
