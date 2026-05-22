import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Enter a name (2–80 characters)." },
      { status: 400 },
    );
  }

  const existing = await prisma.player.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ player: existing });
  }

  const player = await prisma.player.create({ data: { name } });
  return NextResponse.json({ player }, { status: 201 });
}

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, createdAt: true },
  });
  return NextResponse.json({ players });
}
