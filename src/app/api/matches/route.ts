import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const stage = req.nextUrl.searchParams.get("stage");

  const matches = await prisma.match.findMany({
    where: stage ? { stage } : undefined,
    orderBy: [{ kickoffAt: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ matches });
}
