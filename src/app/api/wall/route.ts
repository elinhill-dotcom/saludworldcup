import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_MESSAGE = 500;
const MAX_NAME = 80;
const MIN_NAME = 2;

export async function GET() {
  const comments = await prisma.wallComment.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < MIN_NAME || name.length > MAX_NAME) {
    return NextResponse.json(
      { error: "Enter a name (2–80 characters)." },
      { status: 400 },
    );
  }
  if (message.length < 1 || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Comment must be 1–${MAX_MESSAGE} characters.` },
      { status: 400 },
    );
  }

  const comment = await prisma.wallComment.create({
    data: { name, message },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
