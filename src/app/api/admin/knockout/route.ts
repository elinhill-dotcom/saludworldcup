import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/config";
import { prisma } from "@/lib/db";
import { ALL_TEAMS } from "@/lib/teams";

const validTeams = new Set<string>(ALL_TEAMS);

function sanitizeTeam(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  return validTeams.has(v) ? v : null;
}

export async function GET() {
  const answer = await prisma.knockoutAnswer.findUnique({ where: { id: 1 } });
  return NextResponse.json({ answer });
}

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password") ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong admin password" }, { status: 401 });
  }

  const body = await req.json();
  const answer = await prisma.knockoutAnswer.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      sf1Home: sanitizeTeam(body.sf1Home),
      sf1Away: sanitizeTeam(body.sf1Away),
      sf2Home: sanitizeTeam(body.sf2Home),
      sf2Away: sanitizeTeam(body.sf2Away),
      finalHome: sanitizeTeam(body.finalHome),
      finalAway: sanitizeTeam(body.finalAway),
      bronzeHome: sanitizeTeam(body.bronzeHome),
      bronzeAway: sanitizeTeam(body.bronzeAway),
      champion: sanitizeTeam(body.champion),
      set: true,
    },
    update: {
      sf1Home: sanitizeTeam(body.sf1Home),
      sf1Away: sanitizeTeam(body.sf1Away),
      sf2Home: sanitizeTeam(body.sf2Home),
      sf2Away: sanitizeTeam(body.sf2Away),
      finalHome: sanitizeTeam(body.finalHome),
      finalAway: sanitizeTeam(body.finalAway),
      bronzeHome: sanitizeTeam(body.bronzeHome),
      bronzeAway: sanitizeTeam(body.bronzeAway),
      champion: sanitizeTeam(body.champion),
      set: true,
    },
  });

  return NextResponse.json({ answer });
}
