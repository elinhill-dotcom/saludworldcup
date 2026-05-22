import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const commentId = req.nextUrl.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  try {
    await prisma.wallComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
}
